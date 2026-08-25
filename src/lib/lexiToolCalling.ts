/**
 * LEXI AI — Tool Calling Engine & Match Router
 * ============================================
 * Implements standard LLM tool calling schema & execution dispatch for:
 *   • searchWorkers()
 *   • getWorkerDetails()
 *   • checkAvailability()
 *   • createBooking()
 *   • getBookingStatus()
 *   • cancelBooking()
 */

import {
  searchAvailableWorkers,
  getWorkerProfile,
  getPriceEstimate,
  confirmBooking,
  cancelBooking as cancelStoredBooking,
  WorkerMatchResult,
  PriceEstimate
} from "./servicesCatalog";
import { getStoredBookings } from "./storage";
import { WorkerProfile, OnRoadMechanic, ServiceBooking } from "./seedData";

// ─── 1. LLM TOOL DECLARATIONS (OPENROUTER / OPENAI SPEC) ────────────────────

export const LEXI_TOOLS = [
  {
    type: "function",
    function: {
      name: "searchWorkers",
      description: "Search and rank verified skilled workers matching a service category and location.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "Service category (e.g. 'plumber', 'electrician', 'mechanic_car', 'ac', 'cleaning', 'appliances', 'roadside_sos')."
          },
          location: {
            type: "string",
            description: "User location, city, sector, or landmark (e.g. 'Sector 17, Chandigarh', 'Delhi', 'Noida')."
          },
          isEmergency: {
            type: "boolean",
            description: "Whether this is an urgent or emergency request."
          }
        },
        required: ["category"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getWorkerDetails",
      description: "Retrieve comprehensive profile, skills, verified badges, rating, and transparent price estimate for a specific worker.",
      parameters: {
        type: "object",
        properties: {
          workerId: {
            type: "string",
            description: "Unique worker ID (e.g. 'w1', 'm1')."
          },
          category: {
            type: "string",
            description: "Service category for pricing calculation."
          }
        },
        required: ["workerId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "checkAvailability",
      description: "Check if a worker or mechanic is currently online and available for instant or scheduled dispatch.",
      parameters: {
        type: "object",
        properties: {
          workerId: {
            type: "string",
            description: "Worker ID."
          },
          timeSlot: {
            type: "string",
            description: "Requested time slot or 'immediate'."
          }
        },
        required: ["workerId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "createBooking",
      description: "Create and confirm a real booking for a client with a verified worker.",
      parameters: {
        type: "object",
        properties: {
          workerId: { type: "string", description: "Worker ID to book." },
          clientName: { type: "string", description: "Client's full name." },
          clientPhone: { type: "string", description: "Client's contact number." },
          serviceType: { type: "string", description: "Specific service description." },
          location: { type: "string", description: "Client's service address." },
          isEmergency: { type: "boolean", description: "Whether this is emergency dispatch." },
          paymentMethod: { type: "string", enum: ["UPI", "CASH", "CARD"], description: "Chosen payment method." }
        },
        required: ["workerId", "serviceType"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getBookingStatus",
      description: "Get real-time tracking status, worker details, and ETA of an existing booking ID.",
      parameters: {
        type: "object",
        properties: {
          bookingId: {
            type: "string",
            description: "Booking ID (e.g. 'BK-1001')."
          }
        },
        required: ["bookingId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "cancelBooking",
      description: "Cancel an active booking cleanly with zero penalty fee.",
      parameters: {
        type: "object",
        properties: {
          bookingId: { type: "string", description: "Booking ID to cancel." },
          reason: { type: "string", description: "Reason for cancellation." }
        },
        required: ["bookingId"]
      }
    }
  }
];

// ─── 2. TOOL EXECUTION ROUTER ───────────────────────────────────────────────

export interface ToolExecutionResponse {
  toolName: string;
  success: boolean;
  data: any;
  message?: string;
}

export async function executeLexiTool(
  toolName: string,
  args: Record<string, any>
): Promise<ToolExecutionResponse> {
  try {
    switch (toolName) {
      case "searchWorkers": {
        const { category, location = "Chandigarh", isEmergency = false } = args;
        const matches: WorkerMatchResult[] = searchAvailableWorkers(category, location, isEmergency);
        return {
          toolName,
          success: true,
          data: {
            category,
            location,
            count: matches.length,
            workers: matches
          }
        };
      }

      case "getWorkerDetails": {
        const { workerId, category } = args;
        const profile = getWorkerProfile(workerId);
        if (!profile) {
          return { toolName, success: false, data: null, message: `Worker #${workerId} not found.` };
        }
        const estimate: PriceEstimate = getPriceEstimate({
          workerId,
          category: category || ("category" in profile ? profile.category : "plumber")
        });
        return {
          toolName,
          success: true,
          data: {
            worker: profile,
            priceEstimate: estimate
          }
        };
      }

      case "checkAvailability": {
        const { workerId, timeSlot = "immediate" } = args;
        const profile = getWorkerProfile(workerId);
        if (!profile) {
          return { toolName, success: false, data: { available: false, reason: "Worker not found" } };
        }
        const isOnline = "isOnline" in profile ? profile.isOnline : true;
        return {
          toolName,
          success: true,
          data: {
            workerId,
            workerName: profile.name,
            available: isOnline,
            timeSlot,
            etaMins: isOnline ? ("etaMins" in profile ? profile.etaMins : 15) : null
          }
        };
      }

      case "createBooking": {
        const profile = getWorkerProfile(args.workerId);
        if (!profile) {
          return { toolName, success: false, data: null, message: `Worker #${args.workerId} not found.` };
        }
        const estimate = getPriceEstimate({
          workerId: args.workerId,
          isEmergency: args.isEmergency
        });
        const booking: ServiceBooking = confirmBooking({
          workerId: profile.id,
          workerName: profile.name,
          occupation: "occupation" in profile ? profile.occupation : "Specialist Technician",
          clientName: args.clientName || "Client User",
          clientPhone: args.clientPhone || "+91 98765 43210",
          serviceType: args.serviceType || "Service Request",
          location: args.location || "User Location",
          visitFeeAmount: estimate.visitFee,
          isEmergency: args.isEmergency,
          paymentMethod: args.paymentMethod || "UPI"
        });
        return {
          toolName,
          success: true,
          data: {
            bookingId: booking.id,
            status: booking.status,
            workerName: profile.name,
            totalEstimate: estimate.totalEstimate
          },
          message: `Booking #${booking.id} created successfully.`
        };
      }

      case "getBookingStatus": {
        const bookings = getStoredBookings();
        const found = bookings.find((b) => b.id === args.bookingId);
        if (!found) {
          return { toolName, success: false, data: null, message: `Booking #${args.bookingId} not found.` };
        }
        return {
          toolName,
          success: true,
          data: found
        };
      }

      case "cancelBooking": {
        const ok = cancelStoredBooking(args.bookingId, args.reason);
        return {
          toolName,
          success: ok,
          data: { bookingId: args.bookingId, cancelled: ok },
          message: ok ? `Booking #${args.bookingId} cancelled successfully.` : "Failed to cancel booking."
        };
      }

      default:
        return { toolName, success: false, data: null, message: `Unknown tool '${toolName}'` };
    }
  } catch (e: any) {
    return { toolName, success: false, data: null, message: e?.message || "Tool execution error" };
  }
}
