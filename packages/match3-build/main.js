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

    const prefabBlockerPath = "prefab/blocker/other/";
    const prefabEffectPath = "prefab/effect/other/";
    const levelPath = "level/";
    const texturePath = "icon/other/";

    if (!isStart)
    {
        MoveFilesRecursive(srcAssetsPath + levelPath, destAssetsPath + levelPath, "", true);

        MoveFilesRecursive(srcAssetsPath + prefabBlockerPath, destAssetsPath + prefabBlockerPath, "", true);
        MoveFilesRecursive(srcAssetsPath + prefabEffectPath, destAssetsPath + prefabEffectPath, "", true);
        MoveFilesRecursive(srcAssetsPath + texturePath, destAssetsPath + texturePath, "", true);

    }
    else
    {
        const jsonPath = path.join(Editor.Project.path, 'assets/resources/table/BuildConfig.json');
        const jsonData  = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        // Editor.log('jsondata = ' + jsonData.TiledMapScale);

        const levelFilePath = levelPath + jsonData.BuildLevelId + ".json";
        fs.renameSync(srcAssetsPath + levelFilePath, destAssetsPath + levelFilePath);
        fs.renameSync(srcAssetsPath + levelFilePath + ".meta", destAssetsPath + levelFilePath + ".meta");

        for (let i = 0; i < jsonData.BuildAssets.length; i++) {
          const element = jsonData.BuildAssets[i];

          if (element.length == 0)
          {
              continue;
          }

          Editor.log('element = ' + element);

          MoveFilesRecursive(srcAssetsPath + prefabBlockerPath, destAssetsPath + prefabBlockerPath, element, false);
          MoveFilesRecursive(srcAssetsPath + prefabEffectPath, destAssetsPath + prefabEffectPath, element, false);
          MoveFilesRecursive(srcAssetsPath + texturePath, destAssetsPath + texturePath, element, false);
      }
    }

    // Editor.assetdb.refresh('assets');


    // const AssetDB = Editor.require('asset-db');

    // // 获取资源管理器实例
    // let assetdb = AssetDB.assetdb();

    // // 要刷新的文件夹路径
    // let folderPath = "assets";

    // // 刷新文件夹
    // assetdb.refresh(folderPath, (err) => {
    //   if (err) {
    //     console.error("刷新文件夹失败：" + err);
    //   } else {
    //     console.log("文件夹刷新成功");
    //   }
    // });
}

function onBeforeBuildFinish (options, callback) {
    Editor.log('---------- BeforeBuild ' + options.platform + ' to ' + options.dest);

    // var mainJsPath = path.join(options.dest, 'main.js');  // 获取发布目录下的 main.js 所在路径
    // var script = fs.readFileSync(mainJsPath, 'utf8');     // 读取构建好的 main.js
    // script += '\n' + 'window.myID = "01234567";';         // 添加一点脚本到
    // fs.writeFileSync(mainJsPath, script);                 // 保存 main.js

    CheckAssets(false);

    CheckAssets(true);
    
    callback();
}

function onBuildFinish (options, callback) {

  Editor.log('---------- BuildFinish ' + options.platform + ' to ' + options.dest);

  CheckAssets(false);

  RefreshAsset();

  callback();
}

function MoveFilesRecursive(sourceDir, destDir, prefabName, isAll)
{
  Editor.log('sourceDir = ' + sourceDir);

  // 递归遍历目录
  let items = fs.readdirSync(sourceDir);
  items.forEach(item => {
    let sourcePath = path.join(sourceDir, item);
    let stats = fs.statSync(sourcePath);
    //Editor.log('sourcePath = ' + sourcePath + ' stats.isFile() = ' + stats.isFile() + ' item.includes(prefabName) = ' + item.includes(prefabName) + " stats " + stats + " item = " + item);
    if (stats.isDirectory()) {
      // 如果是目录，则递归其内容
      MoveFilesRecursive(sourcePath, destDir);
    } else if (stats.isFile() && !item.includes('Readme') && (prefabName.length != 0 && item.includes(prefabName) || isAll)) {

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

function RefreshAsset()
{
  Editor.assetdb.refresh("db://assets/art");
  Editor.assetdb.refresh("db://assets/resources");
}

module.exports = {
    load () {
        Editor.Builder.on('build-start', onBeforeBuildFinish);
        Editor.Builder.on('build-finished', onBuildFinish);        
    },

    unload () {
        Editor.Builder.removeListener('build-start', onBeforeBuildFinish);
        Editor.Builder.removeListener('build-finished', onBuildFinish);
    },

    messages: {
      'move-assets'() {
          //do some work
          Editor.log("move-assets start !!!");

          CheckAssets(false);
          CheckAssets(true);

          RefreshAsset();

          Editor.log("move-assets done !!!");

      }
  }
};