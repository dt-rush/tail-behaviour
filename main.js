const mathjs = require('mathjs');
const memoize = require("memoizee");


const memoizedCombinations = memoize((n, x) => {
	return mathjs.combinations(mathjs.bignumber(n), mathjs.bignumber(x));
});

const binomcdf = (n, k, p) => {
	let sum = 0;
	for (let x = k; x <= n; x++) {
		sum += mathjs.number(mathjs.multiply(
			memoizedCombinations(n, x), 
			mathjs.bignumber(mathjs.pow(p, x)),
			mathjs.bignumber(mathjs.pow(1 - p, n - x))
		));
	}
	return sum;
};

const percentiles = [90, 99, 99.9, 99.99, 99.999];

const mappings = [];
for (let j = 0; j < percentiles.length; j++) {
	const mapping = {};
	const percentile = percentiles[j];
	const power = (j == 0) ? 3 : 4;
	for (let i = 0; i < power; i++) {
		const n = Math.pow(10, i);
		const p = (1 - percentile/100);
		mapping[n] = binomcdf(n, 1, p);
	}
	// use prior results to approximate the value for i-values which would
	// involve evaluation combinations that burn cpu on 100 for a long, long time
	// (i = 4 to i = 6)
	if (j >= 1) {
		for (let k = 4; k < 6; k++) {
			const n = Math.pow(10, k);
			if (mappings[j - 1][n/10]) {
				const p = (1 - percentile/100);
				mapping[n] = mappings[j - 1][n/10];
			}
		}
	}
	mappings[j] = mapping;
}

for (let i = 0; i < mappings.length; i++) {
	const percentile = percentiles[i];
	const mapping = mappings[i];
	console.log(`behaviour for the ${percentile}'th percentile:`);
	console.log('      n      |    probability of observing at least once');
	console.log('-------------o-----------------------------------------------');
	Object.keys(mapping).forEach((n) => {
		const padding = ''.padStart(11 - n.toString().length, ' ');
		console.log(`  ${n}${padding}|    ${mapping[n]}`);
	});
	console.log('\n\n');
}
