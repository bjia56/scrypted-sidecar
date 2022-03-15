// next.config.js
module.exports = {
	pageExtensions: ['coffee', 'jsx', 'js', 'tsx', 'ts'],
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
}