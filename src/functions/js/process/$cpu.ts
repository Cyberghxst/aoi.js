import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { funcData, Scope, parseString } from "../../../index.js";
import { escapeResult } from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

const cpu = new AoiJSFunction()
    .setName("$cpu")
    .setType(FunctionType.FunctionGetter)
    .setBrackets(true)
    .setOptional(true)
    .setFields([
        {
            name: "type",
            type: "process|os",
            description: "The type of cpu usage to get",
            required: false,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["process"])
    .setReturns("number")
    .setDescription("Returns the CPU usage")
    .setExample(`
    $cpu // returns the cpu usage of the process    
    $cpu[os] // returns the cpu usage of the os
    `);

cpu.setCode((data: funcData, scope: Scope[], thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);
    const type = parseString(data.inside ?? "process");
    let res = escapeResult(`function secNSec2ms (secNSec) {
  if (Array.isArray(secNSec)) { 
    return secNSec[0] * 1000 + secNSec[1] / 1000000; 
  }
  return secNSec / 1000; 
}

function __$get_cpu_usage$__(type) {
        if (type === "process") {
const startTime  = process.hrtime()
const startUsage = process.cpuUsage()

const now = Date.now()
while (Date.now() - now < 100) {}

const elapTime = process.hrtime(startTime)
var elapUsage = process.cpuUsage(startUsage)

const elapTimeMS = secNSec2ms(elapTime)
const elapUserMS = secNSec2ms(elapUsage.user)
const elapSystMS = secNSec2ms(elapUsage.system)
const cpuPercent = (100 * (elapUserMS + elapSystMS) / elapTimeMS).toFixed(2)
return cpuPercent
        } else if (type === "os") {
            return ((OS.loadavg()[0] * 100)/OS.cpus().length).toFixed(2)
        } else {
            throw new Error(\`${data.name}: Invalid Type \${type}\`);
        }
}`);
    if (!currentScope.packages.includes("const OS = await import(\"os\")")) {
        currentScope.packages += "const OS = await import(\"os\")\n";
    }
    if (
        !currentScope.functions.includes(
            "function __$get_cpu_usage$__(type) {",
        )
    ) {
        currentScope.functions += res + "\n";
    }
    res = escapeResult(`__$get_cpu_usage$__(${type})`);
    currentScope.rest = currentScope.rest.replace(data.total, res);
    return {
        code: res,
        scope: scope,
    };
}, cpu);

export const $cpu = cpu.build();
