export enum TranspilerCustoms
{
    F = "#FUNCTION#",
    FS = "#FUNCTION_START#",
    FE = "#FUNCTION_END#",
    FSEP = "#FUNCTION_SEPARATOR#",
    FFUN = "#FUNCTION_FUNCTION#",
    FSET = "#FUNCTION_SETTER#",
    FGET = "#FUNCTION_GETTER",
    FISS = "#FUNCTION_INSIDE_SCOPE_START#",
    FISE = "#FUNCTION_INSIDE_SCOPE_END#",
    FSS = "#FUNCTION_SCOPE_START#",
    FSE = "#FUNCTION_SCOPE_END#",
    FFS = "#FUNCTION_FUNCTION_START#",
    FFE = "#FUNCTION_FUNCTION_END#",
    MFS = "#MATH_FUNCTION_START#",
    MFE = "#MATH_FUNCTION_END#",
    SL = "#STRING_LITERAL#",
    NL = "#NEW_LINE#",
    OSEP = "#OBJECT_SEPARATOR#",
    OS = "#OBJECT_STARTER#",
    OE = "#OBJECT_ENDER#",
    AS = "#ARRAY_STARTER#",
    AE = "#ARRAY_ENDER#",
    ASEP = "#ARRAY_SEPARATOR#",
}

export enum BundlerCustoms  {
    LB = "#LEFT_BRACKET#",
    RB = "#RIGHT_BRACKET#",
    EJS = "#EMBEDDED_JS#",
}

export enum AoiClientEvents {
    Error = "error",
}

export enum FunctionType {
    Getter = "getter",
    Setter = "setter",
    Function = "function",
    FunctionGetter = "function_getter",
    Scope = "scope",
    ScopeGetter = "scope_getter",
}

export enum ReturnType {
    Void = "void",
    Number = "number",
    String = "string",
    StringOptional = "?string",
    Any = "any",
    Boolean = "boolean",
    BigInt = "bigint",
    Object = "object",
    Array = "array",
}

export enum CommandType {
    Basic = "basic",
    Interaction = "interaction",
    Ready = "ready",
    Debug = "debug",
    Component = "component",
}

export enum AutoFetchDataType {
    Guild = "guild",
    Channel = "channel",
    Emoji = "emoji",
    Member = "member",
    Role = "role",
    User = "user",
    All = "all",
}

export enum PluginType {
    Pre = "pre",
    Post = "post",
    Load = "load",
    PreEvent = "preEvent",
    PostEvent = "postEvent",
    PreCommand = "preCommand",
    PostCommand = "postCommand",
}

export enum ExecuteAt {
    Guild = "guild",
    Dm = "dm",
    Both = "both",
}
