var path = require('path');
var fs = require('fs');


function onBeforeBuildFinish (options, callback) {
    Editor.log('---------- Building ' + options.platform + ' to ' + options.dest); // 你可以在控制台输出点什么

    // var mainJsPath = path.join(options.dest, 'main.js');  // 获取发布目录下的 main.js 所在路径
    // var script = fs.readFileSync(mainJsPath, 'utf8');     // 读取构建好的 main.js
    // script += '\n' + 'window.myID = "01234567";';         // 添加一点脚本到
    // fs.writeFileSync(mainJsPath, script);                 // 保存 main.js

    const jsonPath = path.join(Editor.Project.path, 'assets/resources/table/BuildConfig.json');
    const jsonData  = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    Editor.log('jsondata = ' + jsonData.TiledMapScale);

    const artAssetsPath = Editor.Project.path + "/assets/art";
    const resourcesAssetsPath = Editor.Project.path + "/assets/resources";

    const prefabBlockerPath = "prefab/blocker/";
    const prefabEffectPath = "prefab/effect/";
    const levelPath = "level/";
    const texturePath = "texture/";

    let prefabName = [];
    let folderPath = "";
    
    // for (let i = 0; i < Game.m_buildConfig.BuildAssets.length; i++) {
    //     const element = Game.m_buildConfig.BuildAssets[i];
    //     if (prefabName.findIndex() != -1)

    //     folderPath = artAssetsPath + prefabBlockerPath;

    //     fs.readdirSync(folderPath).forEach((file) => {
    //       const filePath = path.join(folderPath, file);
      
    //       if (fs.statSync(filePath).isFile()) {
    //         const fileName = path.parse(file).name;
    //         if (fileName.findIndex(element) != -1)
    //         {
    //             moveFile(folderPath, resourcesAssetsPath + )

    //             files.push(fileName);
    //         }
    //       }
    //     });
    //   }
    
    callback();
}

// 移动文件的函数
function moveFile(sourcePath, targetFolder) {
  const fileName = path.basename(sourcePath);
  const targetPath = path.join(targetFolder, fileName);

  fs.rename(sourcePath, targetPath, (error) => {
    if (error) {
      Editor.error('Failed to move file:', error);
    } else {
      Editor.log('File moved successfully!');
    }
  });
}

function getFilesInFolder(folderPath) {
  const files = [];

  

  return files;
}

module.exports = {
    load () {
        Editor.Builder.on('build-start', onBeforeBuildFinish);
    },

    unload () {
        Editor.Builder.removeListener('build-start', onBeforeBuildFinish);
    }
};