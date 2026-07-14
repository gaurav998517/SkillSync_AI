// Jest setup file
// Mocking @xenova/transformers to prevent ESM import syntax errors in Jest's CommonJS environment
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });
process.env.DATABASE_URL = process.env.DATABASE_TEST_URL || process.env.DATABASE_URL;
process.env.DIRECT_URL = process.env.DATABASE_TEST_URL || process.env.DIRECT_URL;


jest.mock('@xenova/transformers', () => {
    return {
        pipeline: jest.fn().mockResolvedValue(() => {
            return jest.fn().mockResolvedValue([{ embedding: new Array(384).fill(0.1) }]);
        }),
        cos_sim: jest.fn().mockReturnValue(0.8)
    };
});
