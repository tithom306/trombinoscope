import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const dbUrl = process.env.DATABASE_URL || "file:trombinoscope.db";
const isSqlite = dbUrl.startsWith("file:");

// Initialize Prisma
let prisma;
if (isSqlite) {
  console.log(`Connecting to SQLite database: trombinoscope.db`);
  const adapter = new PrismaBetterSqlite3({ url: "file:trombinoscope.db" });
  prisma = new PrismaClient({ adapter });
} else {
  console.log(`Connecting to PostgreSQL database on OpenShift...`);
  // Import conditionally for pg adapter
  const { Pool } = await import("pg");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const pool = new Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
}

// Map DB Models to Frontend Contract format
function mapMember(m) {
  const schedule = {};
  if (m.schedule) {
    m.schedule.forEach((p) => {
      schedule[p.day] = p.station;
    });
  }
  return {
    id: m.id,
    name: m.name,
    role: m.role,
    avatar: m.avatar,
    email: m.email,
    bio: m.bio || "",
    chocoblasts: m.chocoblasts,
    skills: m.skills ? m.skills.map((s) => ({ name: s.name, level: s.level })) : [],
    certifications: m.certifications
      ? m.certifications.map((c) => ({ name: c.name, provider: c.provider }))
      : [],
    presence: { schedule },
  };
}

function mapProject(p) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    members: p.members ? p.members.map(mapMember) : [],
  };
}

function mapOffice(o) {
  return {
    id: o.id,
    name: o.name,
    stations: o.stations ? o.stations.map((s) => s.name) : [],
  };
}

function mapKebabSession(s) {
  return {
    id: s.id,
    date: s.date.toISOString(),
    status: s.status,
    orders: s.orders
      ? s.orders.map((o) => ({
          id: o.id,
          memberId: o.memberId,
          memberName: o.member ? o.member.name : "Inconnu",
          sauces: o.sauces ? JSON.parse(o.sauces) : [],
          ingredients: o.ingredients ? JSON.parse(o.ingredients) : [],
          comment: o.comment || "",
          timestamp: o.timestamp.toISOString(),
        }))
      : [],
  };
}

// Seed function to migrate metadata.json to SQLite/Postgres if database is empty
async function seedDatabase() {
  try {
    const projectCount = await prisma.project.count();
    if (projectCount > 0) {
      console.log("Database already populated. Skipping migration.");
      return;
    }

    const metadataPath = path.resolve(__dirname, "metadata.json");
    if (!fs.existsSync(metadataPath)) {
      console.log("metadata.json not found, skipping migration.");
      return;
    }

    console.log("Initializing database from metadata.json...");
    const data = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));

    // Save app settings
    await prisma.appConfig.upsert({
      where: { key: "appName" },
      update: { value: data.name || "SkyCenter" },
      create: { key: "appName", value: data.name || "SkyCenter" },
    });
    await prisma.appConfig.upsert({
      where: { key: "version" },
      update: { value: data.version || "3.0" },
      create: { key: "version", value: data.version || "3.0" },
    });

    // Save Offices & Stations
    if (data.offices) {
      for (const office of data.offices) {
        await prisma.office.create({
          data: {
            id: office.id,
            name: office.name,
            stations: {
              create: office.stations.map((stationName) => ({
                name: stationName,
              })),
            },
          },
        });
      }
    }

    // Save Projects, Members, Skills, Certs, Presence
    if (data.projects) {
      for (const project of data.projects) {
        await prisma.project.create({
          data: {
            id: project.id,
            name: project.name,
            description: project.description,
          },
        });

        if (project.members) {
          for (const member of project.members) {
            await prisma.staffMember.create({
              data: {
                id: member.id,
                name: member.name,
                role: member.role,
                avatar: member.avatar,
                email: member.email,
                bio: member.bio || "",
                chocoblasts: member.chocoblasts || 0,
                projectId: project.id,
                skills: {
                  create: member.skills
                    ? member.skills.map((s) => ({ name: s.name, level: s.level }))
                    : [],
                },
                certifications: {
                  create: member.certifications
                    ? member.certifications.map((c) => ({
                        name: c.name,
                        provider: c.provider,
                      }))
                    : [],
                },
                schedule: {
                  create:
                    member.presence && member.presence.schedule
                      ? Object.entries(member.presence.schedule).map(([day, station]) => ({
                          day,
                          station: String(station),
                        }))
                      : [],
                },
              },
            });
          }
        }
      }
    }

    // Save Kebab Sessions & Orders
    if (data.kebabSessions) {
      for (const session of data.kebabSessions) {
        await prisma.kebabSession.create({
          data: {
            id: session.id,
            date: new Date(session.date),
            status: session.status,
          },
        });

        if (session.orders) {
          for (const order of session.orders) {
            // Verify if member exists first (to prevent foreign key issues)
            const memberExists = await prisma.staffMember.findUnique({
              where: { id: order.memberId },
            });
            if (memberExists) {
              await prisma.kebabOrder.create({
                data: {
                  id: order.id,
                  sessionId: session.id,
                  memberId: order.memberId,
                  sauces: JSON.stringify(order.sauces || []),
                  ingredients: JSON.stringify(order.ingredients || []),
                  comment: order.comment || "",
                  timestamp: order.timestamp ? new Date(order.timestamp) : new Date(),
                },
              });
            }
          }
        }
      }
    }
    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// Express App Setup
const app = express();
app.use(cors());
app.use(express.json());

// Routes
// 1. GET /api/data - Get all database records formatted for frontend
app.get("/api/data", async (req, res) => {
  try {
    const appNameCfg = await prisma.appConfig.findUnique({ where: { key: "appName" } });
    const versionCfg = await prisma.appConfig.findUnique({ where: { key: "version" } });
    
    const projects = await prisma.project.findMany({
      include: {
        members: {
          include: {
            skills: true,
            certifications: true,
            schedule: true,
          },
        },
      },
    });

    const offices = await prisma.office.findMany({
      include: { stations: true },
    });

    const kebabSessions = await prisma.kebabSession.findMany({
      include: {
        orders: {
          include: { member: true },
        },
      },
      orderBy: { date: "desc" },
    });

    res.json({
      name: appNameCfg ? appNameCfg.value : "SkyCenter",
      version: versionCfg ? versionCfg.value : "3.0",
      projects: projects.map(mapProject),
      offices: offices.map(mapOffice),
      kebabSessions: kebabSessions.map(mapKebabSession),
    });
  } catch (error) {
    console.error("Error loading app data:", error);
    res.status(500).json({ error: "Failed to load database records." });
  }
});

// 2. POST /api/projects - Add a project
app.post("/api/projects", async (req, res) => {
  const { id, name, description } = req.body;
  try {
    const project = await prisma.project.create({
      data: { id, name, description },
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: "Failed to create project." });
  }
});

// 3. POST /api/members - Add a staff member
app.post("/api/members", async (req, res) => {
  const { id, name, role, avatar, email, bio, chocoblasts, projectId, skills, certifications, presence } = req.body;
  try {
    const member = await prisma.staffMember.create({
      data: {
        id,
        name,
        role,
        avatar,
        email,
        bio: bio || "",
        chocoblasts: chocoblasts || 0,
        projectId,
        skills: {
          create: skills ? skills.map((s) => ({ name: s.name, level: s.level })) : [],
        },
        certifications: {
          create: certifications ? certifications.map((c) => ({ name: c.name, provider: c.provider })) : [],
        },
        schedule: {
          create: presence && presence.schedule
            ? Object.entries(presence.schedule).map(([day, station]) => ({ day, station: String(station) }))
            : [],
        },
      },
      include: {
        skills: true,
        certifications: true,
        schedule: true,
      },
    });
    res.json(mapMember(member));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create member." });
  }
});

// 4. PUT /api/members/:id - Update member details
app.put("/api/members/:id", async (req, res) => {
  const { id } = req.params;
  const { name, role, avatar, email, bio, projectId, skills, certifications, presence } = req.body;
  try {
    // Delete existing relations to avoid duplicates
    await prisma.skill.deleteMany({ where: { memberId: id } });
    await prisma.certification.deleteMany({ where: { memberId: id } });
    await prisma.presence.deleteMany({ where: { memberId: id } });

    const member = await prisma.staffMember.update({
      where: { id },
      data: {
        name,
        role,
        avatar,
        email,
        bio: bio || "",
        projectId,
        skills: {
          create: skills ? skills.map((s) => ({ name: s.name, level: s.level })) : [],
        },
        certifications: {
          create: certifications ? certifications.map((c) => ({ name: c.name, provider: c.provider })) : [],
        },
        schedule: {
          create: presence && presence.schedule
            ? Object.entries(presence.schedule).map(([day, station]) => ({ day, station: String(station) }))
            : [],
        },
      },
      include: {
        skills: true,
        certifications: true,
        schedule: true,
      },
    });
    res.json(mapMember(member));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update member." });
  }
});

// 5. POST /api/members/:id/chocoblast - Increment chocoblast points
app.post("/api/members/:id/chocoblast", async (req, res) => {
  const { id } = req.params;
  try {
    const member = await prisma.staffMember.update({
      where: { id },
      data: { chocoblasts: { increment: 1 } },
    });
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: "Failed to register chocoblast." });
  }
});

// 6. POST /api/offices - Create office
app.post("/api/offices", async (req, res) => {
  const { id, name, stations } = req.body;
  try {
    const office = await prisma.office.create({
      data: {
        id,
        name,
        stations: {
          create: stations.map((s) => ({ name: s })),
        },
      },
      include: { stations: true },
    });
    res.json(mapOffice(office));
  } catch (error) {
    res.status(500).json({ error: "Failed to create office." });
  }
});

// 7. POST /api/schedule/bulk - Update desks presence schedules in bulk
app.post("/api/schedule/bulk", async (req, res) => {
  const { updates } = req.body; // Array of { memberId, day, assignment (string | null) }
  try {
    await prisma.$transaction(
      updates.map(({ memberId, day, assignment }) => {
        if (assignment === null) {
          return prisma.presence.deleteMany({
            where: { memberId, day },
          });
        } else {
          return prisma.presence.upsert({
            where: {
              // As composite keys are not set, we search and update/create
              id: `${memberId}-${day}`, // We will generate a unique key dynamically or search and delete/create
            },
            update: { station: assignment },
            create: { id: `${memberId}-${day}`, memberId, day, station: assignment },
          });
        }
      })
    );
    res.json({ success: true });
  } catch (error) {
    // If composite upsert fails (since schema has no @unique on memberId-day, let's do a fallback transaction)
    try {
      await prisma.$transaction(async (tx) => {
        for (const { memberId, day, assignment } of updates) {
          await tx.presence.deleteMany({ where: { memberId, day } });
          if (assignment !== null) {
            await tx.presence.create({
              data: { memberId, day, station: assignment },
            });
          }
        }
      });
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update bulk schedules." });
    }
  }
});

// 8. POST /api/kebab-sessions - Create kebab session
app.post("/api/kebab-sessions", async (req, res) => {
  const { id, date, status } = req.body;
  try {
    const session = await prisma.kebabSession.create({
      data: {
        id,
        date: date ? new Date(date) : new Date(),
        status: status || "open",
      },
    });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: "Failed to create session." });
  }
});

// 9. POST /api/kebab-sessions/:id/close - Close session
app.post("/api/kebab-sessions/:id/close", async (req, res) => {
  const { id } = req.params;
  try {
    const session = await prisma.kebabSession.update({
      where: { id },
      data: { status: "closed" },
    });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: "Failed to close session." });
  }
});

// 10. DELETE /api/kebab-sessions/:id - Delete session
app.delete("/api/kebab-sessions/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.kebabSession.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete session." });
  }
});

// 11. POST /api/kebab-sessions/:sessionId/orders - Save/Update order
app.post("/api/kebab-sessions/:sessionId/orders", async (req, res) => {
  const { sessionId } = req.params;
  const { id, memberId, memberName, sauces, ingredients, comment } = req.body;
  try {
    const order = await prisma.kebabOrder.upsert({
      where: { id: id || "temp-null-id" },
      update: {
        sauces: JSON.stringify(sauces || []),
        ingredients: JSON.stringify(ingredients || []),
        comment: comment || "",
        timestamp: new Date(),
      },
      create: {
        id: id || `ko-${Date.now()}`,
        sessionId,
        memberId,
        sauces: JSON.stringify(sauces || []),
        ingredients: JSON.stringify(ingredients || []),
        comment: comment || "",
      },
      include: { member: true },
    });
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save kebab order." });
  }
});

// Start Server
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await seedDatabase();
});
