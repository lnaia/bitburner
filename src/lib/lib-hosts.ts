import { NS } from "@ns";
import { SCRIPT_BATCH_JOB, HOME_SERVER } from "constants";

export const getExistingBatchScripts = (ns: NS) => {
  return ns.ps(HOME_SERVER).reduce((result: string[], script) => {
    if (script.filename === SCRIPT_BATCH_JOB) {
      result.push(`${script.args[0]}`);
    }
    return result;
  }, []);
};
