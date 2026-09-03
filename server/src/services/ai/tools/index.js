/**
 * Skill-Link AI Tool Registry
 * Master catalog and execution dispatcher for autonomous AI tool calling.
 */

const searchWorkersTool = require("./searchWorkers.tool");
const getWorkerDetailsTool = require("./getWorkerDetails.tool");
const searchServicesTool = require("./searchServices.tool");
const getUserBookingsTool = require("./getUserBookings.tool");
const getUserProfileTool = require("./getUserProfile.tool");
const createBookingPreviewTool = require("./createBookingPreview.tool");
const confirmBookingTool = require("./confirmBooking.tool");
const checkWorkerAvailabilityTool = require("./checkWorkerAvailability.tool");

const TOOLS_MAP = {
  searchWorkers: searchWorkersTool,
  search_workers: searchWorkersTool,
  getWorkerDetails: getWorkerDetailsTool,
  get_worker_details: getWorkerDetailsTool,
  searchServices: searchServicesTool,
  search_services: searchServicesTool,
  getServices: searchServicesTool,
  get_services: searchServicesTool,
  getUserBookings: getUserBookingsTool,
  get_user_bookings: getUserBookingsTool,
  getUserProfile: getUserProfileTool,
  get_user_profile: getUserProfileTool,
  createBookingPreview: createBookingPreviewTool,
  create_booking_preview: createBookingPreviewTool,
  confirmBooking: confirmBookingTool,
  confirm_booking: confirmBookingTool,
  checkWorkerAvailability: checkWorkerAvailabilityTool,
  check_worker_availability: checkWorkerAvailabilityTool,
};

const TOOL_DEFINITIONS = [
  searchWorkersTool.definition,
  getWorkerDetailsTool.definition,
  searchServicesTool.definition,
  getUserBookingsTool.definition,
  getUserProfileTool.definition,
  createBookingPreviewTool.definition,
  confirmBookingTool.definition,
  checkWorkerAvailabilityTool.definition,
];

/**
 * Validates and executes a requested tool autonomously
 * @param {string} toolName
 * @param {Object} args
 * @param {Object} [userContext]
 * @returns {Promise<{ success: boolean, toolName: string, result: any, richPayload?: any, error?: string }>}
 */
async function executeTool(toolName, args = {}, userContext = {}) {
  console.log(`[Tool Registry] Executing tool '${toolName}' with args:`, JSON.stringify(args));

  const tool = TOOLS_MAP[toolName];
  if (!tool) {
    console.warn(`[Tool Registry] Unknown tool called: '${toolName}'`);
    return {
      success: false,
      toolName,
      error: `Tool '${toolName}' is not registered in Skill-Link AI tools catalog.`,
    };
  }

  try {
    const output = await tool.execute(args, userContext);
    console.log(
      `[Tool Registry] Tool '${toolName}' executed successfully. Count/Status:`,
      output.count || (output.success ? "OK" : "FAILED")
    );
    return {
      success: output.success !== false,
      toolName,
      result: output,
      richPayload: output.richPayload || null,
      requiresConfirmation: output.requiresConfirmation || false,
    };
  } catch (err) {
    console.error(`[Tool Registry] Error during tool '${toolName}' execution:`, err);
    return {
      success: false,
      toolName,
      error: err.message || "Failed to execute tool.",
    };
  }
}

module.exports = {
  TOOL_DEFINITIONS,
  executeTool,
  TOOLS_MAP,
};
