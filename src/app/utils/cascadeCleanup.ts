import mongoose from "mongoose";

export const cascadeCleanup = async (
  session: mongoose.ClientSession | null,
  docId: any,
  cleanupMap: {
    model: mongoose.Model<any>;
    fields: string[];
  }[]
) => {
  const ops = cleanupMap.map((item) => {
    const pullQuery = item.fields.reduce((acc, field) => {
      acc[field] = docId;
      return acc;
    }, {} as any);

    return item.model.updateMany(
      {},
      { $pull: pullQuery },
      session ? { session } : {}
    );
  });

  await Promise.all(ops);
};
