module.exports = async (d) => {
    const data = d.util.aoiFunc(d);
    if (data.err) return d.error(data.err);

    const [id] = data.inside.splits;
    const MAX_SAFE_INTEGER = 0x7FFFFFFF;

    const timeout = await d.client.db.get(
        "__aoijs_vars__",
        "setTimeout",
        id,
    );
    if (!timeout) return d.error(`AoiError: Timeout ID ${id} not found.`);

    if ((timeout.value.__duration__ - Date.now()) <= MAX_SAFE_INTEGER) {
        clearTimeout(timeout.value.__id__);
    } else {
        clearInterval(timeout.value.__id__)
    }

    await d.client.db.delete("__aoijs_vars__", "setTimeout", id);

    return {
        code: d.util.setCode(data),
    };
};