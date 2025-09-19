import { Query } from "mongoose";

export const applyFilters = (
  query: Query<any[], any>,
  searchText: string,
  fields: string[]
) => {
  if (searchText) {
    const regexPattern = new RegExp(searchText, "i");

    const searchConditions = fields.map((field) => ({
      [field]: regexPattern,
    }));

    query = query.where({ $or: searchConditions });
  }

  return query;
};

export const paginateAndSort = async <T>(
  query: Query<T[], T>,
  page: number = 1,
  limit: number = 10,
  searchText: string = "",
  fields: string[] = []
) => {
  const sortField: string = "createdAt";
  const sortOrder: "asc" | "desc" = "desc";

  const pageNumber = Math.max(1, page);
  const pageSize = Math.max(1, limit);
  const skip = (pageNumber - 1) * pageSize;

  const countQuery = applyFilters(query.clone(), searchText, fields);

  const totalCount = await countQuery.model
    .countDocuments(countQuery.getFilter())
    .exec();

  const results = await applyFilters(query, searchText, fields)
    .sort({
      [sortField]: sortOrder === "desc" ? -1 : 1,
      _id: sortOrder === "desc" ? -1 : 1,
    })
    .skip(skip)
    .limit(pageSize)
    .exec();

  const meta = {
    page: pageNumber,
    limit: pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  };

  return {
    results,
    meta,
  };
};
