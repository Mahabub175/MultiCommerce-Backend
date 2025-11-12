import { Types } from "mongoose";

export const validateReferences = async (
  model: any,
  ids: string | string[] | Types.ObjectId | Types.ObjectId[],
  name?: string
) => {
  if (!ids) return;

  const idsArray = Array.isArray(ids) ? ids : [ids];
  const validIds = idsArray.filter((id) => Types.ObjectId.isValid(id));

  if (!validIds.length) {
    throw new Error(`Invalid ${name || "reference"} ID(s).`);
  }

  const foundDocs = await model
    .find({ _id: { $in: validIds } })
    .select("_id")
    .lean();

  if (foundDocs.length !== validIds.length) {
    const foundIds = foundDocs.map((d: any) => d._id.toString());
    const missingIds = validIds.filter(
      (id) => !foundIds.includes(id.toString())
    );
    throw new Error(
      `The following ${
        name || "reference"
      } ID(s) do not exist: ${missingIds.join(", ")}`
    );
  }
};
