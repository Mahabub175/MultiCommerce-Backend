import { Types } from "mongoose";
import { categoryModel } from "../modules/category/category.model";

export const updateMegaMenuStatus = async (
  categoryId: string,
  status: boolean
) => {
  const categories = await categoryModel.aggregate([
    {
      $match: { _id: new Types.ObjectId(categoryId) },
    },
    {
      $graphLookup: {
        from: "categories",
        startWith: "$_id",
        connectFromField: "children",
        connectToField: "_id",
        as: "descendants",
      },
    },
  ]);

  const descendantIds = categories[0]?.descendants.map((c: any) => c._id) || [];

  await categoryModel.updateMany(
    { _id: { $in: [categoryId, ...descendantIds] } },
    { megaMenuStatus: status }
  );
};
