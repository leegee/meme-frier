const path = require("path");

module.exports = {
    mode: "development",
    devServer: {
        inline: true
    },
    devServer: {
        publicPath: "/",
        contentBase: "./public/",
        hot: true
    },
    devtool: "inline-source-map",
    entry: "./src/main.ts",
    output: {
        path: path.resolve(__dirname, "public/build/"),
        filename: "bundle.js"
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"]
    },
    module: {
        rules: [
            { test: /\.tsx?$/, loader: "ts-loader" }
        ]
    }
};