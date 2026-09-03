/**
 * Tool: getUserProfile
 * Schema and validator for fetching authenticated client user profile details.
 */

const definition = {
  type: "function",
  function: {
    name: "getUserProfile",
    description:
      "Get the current authenticated user's profile information, verified phone number, saved addresses, and active role on Skill-Link.",
    parameters: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "Optional user ID.",
        },
      },
    },
  },
};

/**
 * Validate and execute getUserProfile tool
 */
async function execute(args = {}, userContext = {}) {
  const profile = {
    userId: userContext.userId || "usr-current",
    name: userContext.userName || "Skill-Link Member",
    phone: userContext.userPhone || "+91 98765 43210",
    role: "client",
    location: userContext.location || "Sector 17, Chandigarh",
    savedAddresses: [
      { label: "Home", address: "Sector 17, Chandigarh, 160017" },
      { label: "Office", address: "Industrial Area Phase 1, Chandigarh" },
    ],
    accountStatus: "Active",
    verifiedPhone: true,
  };

  return {
    success: true,
    toolName: "getUserProfile",
    profile,
  };
}

module.exports = {
  definition,
  execute,
};
