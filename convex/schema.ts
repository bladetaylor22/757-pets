import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  pets: defineTable({
    // Required fields
    ownerUserId: v.string(), // Better Auth user ID (primary owner)
    name: v.string(), // Pet name (1-100 chars, trimmed)
    species: v.union(v.literal("dog"), v.literal("cat"), v.literal("other")),
    status: v.union(
      v.literal("active"),
      v.literal("deceased"),
      v.literal("archived")
    ),
    primaryPhotoFileId: v.optional(v.id("_storage")), // Reference to Convex file storage
    createdAt: v.number(), // Timestamp
    updatedAt: v.number(), // Timestamp

    // Strongly recommended fields
    slug: v.string(), // Unique human-friendly identifier
    sex: v.union(v.literal("male"), v.literal("female"), v.literal("unknown"), v.null()),
    isSpayedNeutered: v.union(v.boolean(), v.null()),
    birthDate: v.union(v.number(), v.null()), // Unix timestamp (date only, no time)
    approxAgeYears: v.union(v.number(), v.null()), // Approximate age if birthDate unknown
    breedPrimary: v.union(v.string(), v.null()),
    breedSecondary: v.union(v.string(), v.null()),
    size: v.union(
      v.literal("xs"),
      v.literal("s"),
      v.literal("m"),
      v.literal("l"),
      v.literal("xl"),
      v.null()
    ),
    weightLbs: v.union(v.number(), v.null()), // Weight in pounds (positive number)
    colorPrimary: v.union(v.string(), v.null()),
    colorSecondary: v.union(v.string(), v.null()),
    distinctiveMarks: v.union(v.string(), v.null()),

    // Identification objects
    microchip: v.object({
      chipId: v.union(v.string(), v.null()),
      registry: v.union(v.string(), v.null()),
    }),
    license: v.object({
      licenseNumber: v.union(v.string(), v.null()),
      issuingCity: v.union(v.string(), v.null()),
      expiresAt: v.union(v.number(), v.null()),
    }),

    // Temperament & handling
    temperamentTags: v.array(v.string()),
    handlingNotes: v.union(v.string(), v.null()),
    goodWith: v.object({
      dogs: v.union(v.boolean(), v.null()),
      cats: v.union(v.boolean(), v.null()),
      kids: v.union(v.boolean(), v.null()),
    }),

    // Medical information
    medicalSummary: v.union(v.string(), v.null()),
    allergies: v.union(v.array(v.string()), v.null()),
    medications: v.union(v.array(v.string()), v.null()),
    specialNeeds: v.union(v.string(), v.null()),

    // Emergency contacts (for lost pet scenarios)
    contacts: v.array(
      v.object({
        name: v.string(),
        relationship: v.union(
          v.literal("owner"),
          v.literal("family"),
          v.literal("friend"),
          v.literal("vet"),
          v.literal("other")
        ),
        phone: v.union(v.string(), v.null()),
        email: v.union(v.string(), v.null()),
        preferred: v.boolean(),
      })
    ),

    // Privacy & sharing controls
    shareSettings: v.object({
      allowPublicProfile: v.boolean(),
      showPhoneOnLostPost: v.boolean(),
      showEmailOnLostPost: v.boolean(),
      showExactLocation: v.boolean(),
    }),
  })
    .index("by_ownerUserId", ["ownerUserId"])
    .index("by_slug", ["slug"])
    .index("by_microchipId", ["microchip.chipId"]),

  petMembers: defineTable({
    petId: v.id("pets"),
    userId: v.string(), // Better Auth user ID
    role: v.union(
      v.literal("owner"),
      v.literal("guardian"),
      v.literal("viewer")
    ),
    createdAt: v.number(),
  })
    .index("by_petId", ["petId"])
    .index("by_userId", ["userId"])
    .index("by_petId_and_userId", ["petId", "userId"]),

  petFiles: defineTable({
    petId: v.id("pets"),
    fileId: v.id("_storage"), // Convex file storage ID
    kind: v.union(v.literal("photo"), v.literal("document")),
    docType: v.union(
      v.literal("rabies"),
      v.literal("vaccination"),
      v.literal("adoption"),
      v.literal("insurance"),
      v.literal("other"),
      v.null()
    ),
    visibility: v.union(v.literal("public"), v.literal("private")),
    label: v.union(v.string(), v.null()),
    createdAt: v.number(),
  })
    .index("by_petId", ["petId"])
    .index("by_petId_and_kind", ["petId", "kind"]),

  petVaccineRecords: defineTable({
    petId: v.id("pets"),
    vaccineType: v.union(
      v.literal("rabies"),
      v.literal("dhpp"),
      v.literal("fvrcp"),
      v.literal("bordetella"),
      v.literal("lyme"),
      v.literal("other")
    ),
    administeredAt: v.number(), // Unix timestamp
    expiresAt: v.union(v.number(), v.null()),
    providerName: v.union(v.string(), v.null()),
    documentFileId: v.union(v.id("_storage"), v.null()),
    createdAt: v.number(),
  })
    .index("by_petId", ["petId"])
    .index("by_petId_and_expiresAt", ["petId", "expiresAt"]),

  platformOwners: defineTable({
    userId: v.string(), // Better Auth user ID
    createdAt: v.number(), // Timestamp when user was designated as platform owner
  }).index("by_userId", ["userId"]),
});
