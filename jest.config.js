module.exports = {
	preset: "ts-jest",
	transform: {"\\.ts$": ['ts-jest']},
	collectCoverage: true,
	testEnvironment: "node",
	moduleDirectories: ["node_modules", "src", "test"],
	coverageReporters: ["lcov", "text"],
	testMatch: ["**/test/**/*.ts"]
};
