type LogItem = string | boolean | undefined;

export const log = (
    name: string,
    params: { [key: string]: { [key: string]: LogItem } | LogItem },
) => {
    console.info(name, params);
};
