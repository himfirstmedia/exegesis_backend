import * as supportService from "./service.js";
import { formatApiResponse } from "../../utils/helpers.js";

const handle = (serviceFn, logLabel) => async (req, res) => {
  try {
    const result = await serviceFn(req);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error(`${logLabel} error:`, error);
    return res
      .status(500)
      .json(
        formatApiResponse({
          status: 500,
          message: `Error: ${error.message}`,
        }),
      );
  }
};

// ─── User-side ───────────────────────────────────────────────────────────────
export const createTicket = handle(
  (req) => supportService.createTicket(req.body, req.user.id),
  "createTicket controller",
);

export const getMyTickets = handle(
  (req) => supportService.getMyTickets(req.body, req.user.id),
  "getMyTickets controller",
);

export const getTicket = handle(
  (req) => supportService.getTicket(req.body, req.user.id),
  "getTicket controller",
);

export const replyToTicket = handle(
  (req) => supportService.replyToTicket(req.body, req.user.id),
  "replyToTicket controller",
);

// ─── Admin-side ──────────────────────────────────────────────────────────────
export const getAdminTickets = handle(
  (req) => supportService.getAdminTickets(req.body),
  "getAdminTickets controller",
);

export const getAdminTicket = handle(
  (req) => supportService.getAdminTicket(req.body),
  "getAdminTicket controller",
);

export const adminReply = handle(
  (req) => supportService.adminReply(req.body, req.user.id),
  "adminReply controller",
);

export const updateTicketStatus = handle(
  (req) => supportService.updateTicketStatus(req.body, req.user.id),
  "updateTicketStatus controller",
);

export const getSupportStats = handle(
  () => supportService.getSupportStats(),
  "getSupportStats controller",
);
