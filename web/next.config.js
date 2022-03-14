// next.config.js
function nextConfigWithCoffeescript() {
	nextConfig = {};
	nextConfig.pageExtensions = ['coffee', 'jsx', 'js', 'tsx', 'ts'];

	return Object.assign({}, nextConfig, {
		webpack: function(config, options) {
			const { dir, defaultLoaders } = options;
			config.resolve.extensions.push('.coffee');
			config.module.rules.push({
				test: /\.(coffee)$/,
				include: [dir],
				exclude: /node_modules/,
				use: [
					defaultLoaders.babel,
					{
						loader: 'coffee-loader',
					},
				],
			});
			return config;
		},
	});
}

module.exports = nextConfigWithCoffeescript();
