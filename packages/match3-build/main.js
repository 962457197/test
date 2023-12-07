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
    const audioPath = "audio/other/";
    const levelPath = "level/";
    const texturePath = "icon/other/";

    if (!isStart)
    {
        MoveFilesRecursive(srcAssetsPath + levelPath, destAssetsPath + levelPath, "", true);

        MoveFilesRecursive(srcAssetsPath + prefabBlockerPath, destAssetsPath + prefabBlockerPath, "", true);
        MoveFilesRecursive(srcAssetsPath + prefabEffectPath, destAssetsPath + prefabEffectPath, "", true);
        MoveFilesRecursive(srcAssetsPath + audioPath, destAssetsPath + audioPath, "", true);
        MoveFilesRecursive(srcAssetsPath + texturePath, destAssetsPath + texturePath, "", true);
    }
    else
    {
        const buildConfigJsonPath = path.join(Editor.Project.path, 'assets/resources/table/BuildConfig.json');
        const buildConfigData  = JSON.parse(fs.readFileSync(buildConfigJsonPath, 'utf-8'));
        // Editor.log('jsondata = ' + jsonData.TiledMapScale);

        const levelFilePath = levelPath + buildConfigData.BuildLevelId + ".json";
        fs.renameSync(srcAssetsPath + levelFilePath, destAssetsPath + levelFilePath);
        fs.renameSync(srcAssetsPath + levelFilePath + ".meta", destAssetsPath + levelFilePath + ".meta");

        const levelData  = JSON.parse(fs.readFileSync(destAssetsPath + levelFilePath, 'utf-8'));

        let assetsName = [];
        for (let i = 0; i < levelData.tiledData.length; i++) {
            const tiledData = levelData.tiledData[i];

            for (let j = 0; j < tiledData.blockDataList.length; j++) {
                const blockData = tiledData.blockDataList[j];
                if (blockData.id == 182 || blockData.id == 183 || blockData.id == 184)
                {
                    if (assetsName.indexOf('buttercookies') == -1)
                    {
                        assetsName.push("buttercookies");
                    }
                }
                else if (blockData.id == 5 || blockData.id == 15 || blockData.id == 16)
                {
                    if (assetsName.indexOf('grass') == -1)
                    {
                        assetsName.push("grass");
                    }
                }
                else if (blockData.id == 4)
                {
                    if (assetsName.indexOf('donut') == -1)
                    {
                        assetsName.push("donut");
                    }
                }
            }
        }

        for (let i = 0; i < assetsName.length; i++) {
          const element = assetsName[i];

          if (element.length == 0)
          {
              continue;
          }

          Editor.log('element = ' + element);

          MoveFilesRecursive(srcAssetsPath + prefabBlockerPath, destAssetsPath + prefabBlockerPath, element, false);
          MoveFilesRecursive(srcAssetsPath + prefabEffectPath, destAssetsPath + prefabEffectPath, element, false);
          MoveFilesRecursive(srcAssetsPath + audioPath, destAssetsPath + audioPath, element, false);
          MoveFilesRecursive(srcAssetsPath + texturePath, destAssetsPath + texturePath, element, false);
      }
    }
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

  RefreshAsset(false);

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
    //Editor.log('sourcePath = ' + sourcePath + ' stats.isFile() = ' + stats.isFile() + ' item.includes(prefabName) = ' + item.toLowerCase().includes(prefabName.toLowerCase()) + " stats " + stats + " item = " + item);
    if (stats.isDirectory()) {
      // 如果是目录，则递归其内容
      MoveFilesRecursive(sourcePath, destDir);
    } else if (stats.isFile() && !item.includes('Readme') && (prefabName.length != 0 && item.toLowerCase().includes(prefabName.toLowerCase()) || isAll)) {

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

function RefreshAsset(isStart)
{
    if (isStart)
    {
        Editor.assetdb.refresh("db://assets/art");
        Editor.assetdb.refresh("db://assets/resources");
    }
    else
    {
        Editor.assetdb.refresh("db://assets/resources");
        Editor.assetdb.refresh("db://assets/art");
    }
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

          RefreshAsset(true);

          Editor.log("move-assets done !!!");

      },

      'reset-assets'() {
        //do some work
        Editor.log("reset-assets start !!!");

        CheckAssets(false);
        RefreshAsset(false);

        Editor.log("reset-assets done !!!");

    }
  }
};