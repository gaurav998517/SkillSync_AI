// Mock for @xenova/transformers to prevent ESM syntax errors in Jest tests
module.exports = {
    pipeline: jest.fn().mockResolvedValue(() => {
        return jest.fn().mockResolvedValue([{ embedding: new Array(384).fill(0.1) }]);
    }),
    cos_sim: jest.fn().mockReturnValue(0.8)
};
