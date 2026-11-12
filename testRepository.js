import { CategoryRepository } from "./categories/category.repository.js";

const repo = new CategoryRepository();

// ===== test 1: path is built from returned ids =====
const root = await repo.create({ name: "Electronics", parent_id: null });
const phones = await repo.create({ name: "Phones", parent_id: root.id });
const cases = await repo.create({ name: "Cases", parent_id: phones.id });
console.log(root.path, phones.path, cases.path); // expect: 1  1.2  1.2.3

// ===== test 2: rollback works (parent 9999 doesn't exist) =====
try {
    await repo.create({ name: "Ghost", parent_id: 9999 });
} catch (err) {
    console.log("failed as expected:", err.code); // expect: 23503
}

process.exit();