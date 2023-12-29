import { FastifyHL7Options } from './decorate.js'

/**
 * @since 1.0.0
 * @param opts
 */
export const validateOpts = async (opts: FastifyHL7Options): Promise<FastifyHL7Options> => {
  // Mandatory, Defaulted
  if (typeof opts.enableServer === 'undefined') {
    opts.enableServer = true
  }

  return opts
}
