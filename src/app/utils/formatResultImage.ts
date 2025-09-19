import config from "../config";

export const formatResultImage = <T extends { [key: string]: any }>(
  results: T[] | string,
  fieldName?: string
): T[] | string => {
  const formatItem = (item: T, fieldName?: keyof T): T => {
    const docData = (item as any)._doc || item;
    const fieldData = fieldName ? docData[fieldName] : undefined;

    return {
      ...docData,
      [fieldName || "attachment"]: fieldData
        ? `${config.base_url}/${(fieldData as string).replace(/\\/g, "/")}`
        : fieldData,
    } as T;
  };

  if (Array.isArray(results)) {
    return results.map((item) => formatItem(item, fieldName));
  } else if (typeof results === "string") {
    return `${config.base_url}/${results.replace(/\\/g, "/")}`;
  } else {
    throw new Error("Unexpected results format");
  }
};
