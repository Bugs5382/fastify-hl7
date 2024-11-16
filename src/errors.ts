import createError from "@fastify/error";

export const errors = {
  /** Error if there is an setup error of the plugin itself. */
  FASTIFY_HL7_ERR_SETUP_ERRORS: createError(
    "FASTIFY_HL7_ERR_SETUP_ERRORS",
    "Setup error: %s",
  ),
  /** If an invalid usage error was done, this error would pop up. */
  FASTIFY_HL7_ERR_USAGE: createError(
    "FASTIFY_HL7_ERR_USAGE",
    "Usage error: %s",
  ),
};
