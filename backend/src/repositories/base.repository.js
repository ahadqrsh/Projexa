/**
 * Generic data access.
 *
 * WHY A REPOSITORY LAYER EXISTS
 *  1. Testability — services mock the repository and run with no database at all.
 *  2. Query reuse — "non-deleted, owned by X, paginated, sorted" is written once.
 *  3. Swappability — adding caching or a read replica touches one file.
 *
 * Repositories know Mongoose. Services know business rules. Neither knows HTTP.
 */

import { buildMeta } from '../utils/pagination.util.js';

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  create(payload) {
    return this.model.create(payload);
  }

  insertMany(payloads, options = {}) {
    return this.model.insertMany(payloads, options);
  }

  findById(id, { select, populate, lean = false, options = {} } = {}) {
    let query = this.model.findById(id).setOptions(options);
    if (select) query = query.select(select);
    if (populate) query = query.populate(populate);
    return lean ? query.lean() : query;
  }

  findOne(filter = {}, { select, populate, lean = false, options = {} } = {}) {
    let query = this.model.findOne(filter).setOptions(options);
    if (select) query = query.select(select);
    if (populate) query = query.populate(populate);
    return lean ? query.lean() : query;
  }

  findMany(filter = {}, { select, populate, sort, limit, skip, lean = true } = {}) {
    let query = this.model.find(filter);
    if (select) query = query.select(select);
    if (populate) query = query.populate(populate);
    if (sort) query = query.sort(sort);
    if (typeof skip === 'number') query = query.skip(skip);
    if (typeof limit === 'number') query = query.limit(limit);
    return lean ? query.lean() : query;
  }

  /**
   * One round trip for the page and the count.
   * Sequential await here would double latency on every list endpoint.
   */
  async paginate(filter = {}, { page, limit, skip, sort, select, populate } = {}) {
    const [items, total] = await Promise.all([
      this.findMany(filter, { select, populate, sort, limit, skip }),
      this.model.countDocuments(filter),
    ]);
    return { items, meta: buildMeta({ page, limit, total }) };
  }

  updateById(id, update, options = {}) {
    return this.model.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
      ...options,
    });
  }

  updateOne(filter, update, options = {}) {
    return this.model.findOneAndUpdate(filter, update, {
      new: true,
      runValidators: true,
      ...options,
    });
  }

  updateMany(filter, update, options = {}) {
    return this.model.updateMany(filter, update, options);
  }

  deleteById(id) {
    return this.model.findByIdAndDelete(id);
  }

  deleteMany(filter, options = {}) {
    return this.model.deleteMany(filter, options);
  }

  count(filter = {}) {
    return this.model.countDocuments(filter);
  }

  exists(filter = {}) {
    return this.model.exists(filter);
  }

  aggregate(pipeline) {
    return this.model.aggregate(pipeline);
  }
}

export default BaseRepository;
export { BaseRepository };
