import { FastifyHL7Options } from "./decorate.js";

/**
 * @since 1.0.0
 * @param opts
 */
export const validateOpts = async (
  options: FastifyHL7Options,
): Promise<FastifyHL7Options> => {
  // Mandatory, Defaulted
  if (options.enableServer === undefined) {
    options.enableServer = true;
  }

  return options;
};
