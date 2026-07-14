/**
 * Test helpers: an in-memory stand-in for a MongoDB collection and a minimal
 * Express `res` stub, so controllers can be exercised without a real database.
 */

/**
 * Build a fake collection supporting the driver subset the controllers use:
 * find().toArray(), findOne(), insertOne(), deleteMany(), deleteOne(),
 * findOneAndUpdate(). Equality and `$in` query operators are supported.
 *
 * Ids default to 24-char hex strings so `new ObjectId(id)` round-trips; the
 * matchers compare via String() so ObjectId <-> string comparisons behave.
 */
export function makeCollection(initialDocs = []) {
  let docs = initialDocs.map((d) => ({ ...d }));
  let idCounter = 1;
  const genId = () => String(idCounter++).padStart(24, '0');

  const valueMatches = (docVal, cond) => {
    if (cond && typeof cond === 'object' && '$in' in cond) {
      return cond.$in.some((x) => String(x) === String(docVal));
    }
    if (cond && typeof cond === 'object' && '$ne' in cond) {
      // { field: { $ne: null } } matches only present, non-null values.
      if (cond.$ne === null) return docVal !== null && docVal !== undefined;
      return String(docVal) !== String(cond.$ne);
    }
    // Mongo semantics: { field: null } matches both null and missing fields.
    if (cond === null) {
      return docVal === null || docVal === undefined;
    }
    return String(docVal) === String(cond);
  };

  // Apply a Mongo-style update ($set / $unset) to a doc in place.
  const applyUpdate = (doc, update) => {
    if (update.$set) Object.assign(doc, update.$set);
    if (update.$unset) for (const key of Object.keys(update.$unset)) delete doc[key];
  };
  const matches = (doc, query) =>
    Object.entries(query).every(([key, cond]) => valueMatches(doc[key], cond));

  return {
    get docs() {
      return docs;
    },
    setDocs(next) {
      docs = next.map((d) => ({ ...d }));
    },
    find(query) {
      let result = docs.filter((d) => matches(d, query));
      // Chainable cursor: sort is a no-op in tests; skip/limit slice the result.
      const cursor = {
        sort() {
          return cursor;
        },
        skip(n) {
          result = result.slice(n);
          return cursor;
        },
        limit(n) {
          result = result.slice(0, n);
          return cursor;
        },
        toArray: async () => result
      };
      return cursor;
    },
    async findOne(query) {
      return docs.find((d) => matches(d, query)) || null;
    },
    async countDocuments(query = {}) {
      return docs.filter((d) => matches(d, query)).length;
    },
    async insertOne(doc) {
      const _id = doc._id ?? genId();
      docs.push({ _id, ...doc });
      return { insertedId: _id, acknowledged: true };
    },
    async deleteMany(query) {
      const before = docs.length;
      docs = docs.filter((d) => !matches(d, query));
      return { deletedCount: before - docs.length };
    },
    async deleteOne(query) {
      const idx = docs.findIndex((d) => matches(d, query));
      if (idx === -1) return { deletedCount: 0 };
      docs.splice(idx, 1);
      return { deletedCount: 1 };
    },
    async updateOne(query, update) {
      const doc = docs.find((d) => matches(d, query));
      if (doc) applyUpdate(doc, update);
      return { matchedCount: doc ? 1 : 0, modifiedCount: doc ? 1 : 0 };
    },
    async updateMany(query, update) {
      const targets = docs.filter((d) => matches(d, query));
      targets.forEach((doc) => applyUpdate(doc, update));
      return { matchedCount: targets.length, modifiedCount: targets.length };
    },
    async findOneAndUpdate(query, update, options = {}) {
      const doc = docs.find((d) => matches(d, query));
      if (!doc) return null;
      applyUpdate(doc, update);
      return options.returnDocument === 'after' ? doc : { ...doc };
    },
    // No-op: index creation is a side effect the controllers call but tests ignore.
    async createIndex() {
      return 'index_created';
    }
  };
}

/**
 * Minimal Express response stub that records the status code and JSON body.
 */
export function makeRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}
