export class APIFeatures {
  public prismaQuery: any;
  private queryString: any;

  constructor(queryString: any) {
    this.queryString = queryString;
    this.prismaQuery = {};
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludeFields = ["page", "sort", "limit", "fields"];
    excludeFields.forEach((el) => delete queryObj[el]);

    // Advanced filtering
    let where: any = {};
    
    Object.keys(queryObj).forEach((key) => {
      const val = queryObj[key];
      
      if (typeof val === "object" && val !== null) {
        // Handle operators like gte, gt, lte, lt
        where[key] = {};
        Object.keys(val).forEach((op) => {
          const numVal = parseFloat(val[op]);
          where[key][op] = isNaN(numVal) ? val[op] : numVal;
        });
      } else {
        const numVal = parseFloat(val);
        where[key] = isNaN(numVal) ? val : numVal;
      }
    });

    this.prismaQuery.where = where;
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").map((el: string) => {
        const order = el.startsWith("-") ? "desc" : "asc";
        const field = el.startsWith("-") ? el.substring(1) : el;
        return { [field]: order };
      });
      this.prismaQuery.orderBy = sortBy;
    } else {
      this.prismaQuery.orderBy = { createdAt: "desc" };
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields: any = {};
      this.queryString.fields.split(",").forEach((el: string) => {
        fields[el] = true;
      });
      this.prismaQuery.select = fields;
    }
    return this;
  }

  paginate() {
    const page = parseInt(this.queryString.page) || 1;
    const limit = parseInt(this.queryString.limit) || 100;
    const skip = (page - 1) * limit;

    this.prismaQuery.skip = skip;
    this.prismaQuery.take = limit;

    return this;
  }
}
