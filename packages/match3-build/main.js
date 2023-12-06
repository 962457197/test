var path = require('path');
var fs = require('fs');

function CheckAssets(isStart)
{
    let srcAssetsPath = Editor.Project.path + "/assets/art/";
    let destAssetsPath = Editor.Project.path + "/assets/resources/";

    if (!isStart)
    {
      let srcTemp = srcAssetsPath;
      srcAssetsPath = destAssetsPath;
      destAssetsPath = srcTemp;
    }

    const jsonPath = path.join(Editor.Project.path, 'assets/resources/table/BuildConfig.json');
    const jsonData  = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    Editor.log('jsondata = ' + jsonData.TiledMapScale);


    const prefabBlockerPath = "prefab/blocker/";
    const prefabEffectPath = "prefab/effect/";
    const levelPath = "level/" + jsonData.BuildLevelId + ".json";
    const texturePath = "icon/";

    // fs.renameSync(srcAssetsPath + levelPath, destAssetsPath + levelPath);
    for (let i = 0; i < jsonData.BuildAssets.length; i++) {
        const element = jsonData.BuildAssets[i];

        Editor.log('element = ' + element);

        MoveFilesRecursive(srcAssetsPath + prefabBlockerPath, destAssetsPath + prefabBlockerPath, element);
        MoveFilesRecursive(srcAssetsPath + prefabEffectPath, destAssetsPath + prefabEffectPath, element);
        MoveFilesRecursive(srcAssetsPath + texturePath, destAssetsPath + texturePath, element);
    }
}

function onBeforeBuildFinish (options, callback) {
    Editor.log('---------- BeforeBuild ' + options.platform + ' to ' + options.dest);

    // var mainJsPath = path.join(options.dest, 'main.js');  // 获取发布目录下的 main.js 所在路径
    // var script = fs.readFileSync(mainJsPath, 'utf8');     // 读取构建好的 main.js
    // script += '\n' + 'window.myID = "01234567";';         // 添加一点脚本到
    // fs.writeFileSync(mainJsPath, script);                 // 保存 main.js

    CheckAssets(true);
    
    callback();
}

function onBuildFinish (options, callback) {

  Editor.log('---------- BuildFinish ' + options.platform + ' to ' + options.dest);

  CheckAssets(false);

  callback();
}

function MoveFilesRecursive(sourceDir, destDir, prefabName)
{
  Editor.log('sourceDir = ' + sourceDir);

  // 递归遍历目录
  let items = fs.readdirSync(sourceDir);
  items.forEach(item => {
    let sourcePath = path.join(sourceDir, item);
    let stats = fs.statSync(sourcePath);
    Editor.log('sourcePath = ' + sourcePath + ' stats.isFile() = ' + stats.isFile() + ' item.includes(prefabName) = ' + item.includes(prefabName));
    if (stats.isDirectory()) {
      // 如果是目录，则递归其内容
      MoveFilesRecursive(sourcePath, destDir);
    } else if (stats.isFile() && item.includes(prefabName)) {

      // // 检查是否为文件且符合名字条件
      // let destPath = path.join(destDir, item);
      // // 创建目标目录如果它不存在
      // fs.ensureDirSync(destDir);
      // // 移动文件
      // fs.renameSync(sourcePath, destPath);
      // Editor.log(`Moved: ${sourcePath} -> ${destPath}`);

      const destFilePath = path.join(destDir, item);
        try {
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
        } catch (err) {
          if (err.code !== 'EEXIST') throw err;
        }
        try {
          fs.renameSync(sourcePath, destFilePath);
          Editor.log(`Moved: ${sourcePath} -> ${destFilePath}`);
        } catch(err) {
          Editor.error(`Failed to move: ${sourcePath} -> ${destFilePath}, Error: ${err}`);
        }
    }
  });
}

module.exports = {
    load () {
        Editor.Builder.on('build-start', onBeforeBuildFinish);
        Editor.Builder.on('build-finished', onBuildFinish);        
    },

    unload () {
        Editor.Builder.removeListener('build-start', onBeforeBuildFinish);
        Editor.Builder.removeListener('build-finished', onBuildFinish);
    }
};