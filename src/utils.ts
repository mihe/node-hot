import * as path from 'path';

class Map<T> {
	[key: string]: T | undefined;
}

const nodeModulesPath = path.sep + 'node_modules' + path.sep;

function isPackage(modulePath: string) {
	return modulePath.indexOf(nodeModulesPath) > 0;
}

function isEligible(modulePath: string) {
	return !isPackage(modulePath);
}

function logInfo(...msg: any[]) {
	console.log('[node-hot]', ...msg);
}

function logError(...msg: any[]) {
	console.error('[node-hot]', ...msg);
}

export {
	Map,
	isPackage,
	isEligible,
	logInfo,
	logError
};
