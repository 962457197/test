#!/usr/bin/python3

import os
import time
import sys
from html.parser import HTMLParser
import base64
import simplejson
import math

if sys.getdefaultencoding() != 'utf-8':
    reload(sys)
    sys.setdefaultencoding('utf-8')

settingMatchKey = '{#settings}'
mainMatchKey = '{#main}'
engineMatchKey = '{#cocosengine}'
projectMatchKey = '{#project}'
resMapMatchKey = '{#resMap}'
ttfMapMatchKey = '{#ttfMap}'

fileByteList = ['.png', '.jpg', '.mp3','.wav','.ogg', '.ttf', '.plist', 'txt']

base64PrefixList = {
  '.png' : 'data:image/png;base64,',
  '.jpg' : 'data:image/jpeg;base64,',
  '.mp3' : '',
  '.wav' : '',
  '.ogg' : '',
  '.ttf' : '',
  '.plist' : 'data:text/plist;base64,'
}

def read_in_chunks(filePath):
    extName = os.path.splitext(filePath)[1]
    if extName in fileByteList:
        file_object = open(filePath, 'rb')
        valueStr = file_object.read()
        base64Str = base64.b64encode(valueStr)
        if extName == '.plist':
            return valueStr
        base64Prefix = base64PrefixList[extName]
        if base64Prefix != None:
            base64Str = bytes(base64Prefix, 'utf-8') + base64Str
            return base64Str
    elif extName == '':
        return None

    file_object = open(filePath, encoding='utf-8')
    return file_object.read()

def writeToPath(path, data):
    with open(path,'w', encoding='utf-8') as f:
        f.write(data)

def getResMap(jsonObj, path, resPath):
    fileList = os.listdir(path)
    for fileName in fileList:
        absPath = path + '/' + fileName
        if (os.path.isdir(absPath)):
            getResMap(jsonObj, absPath, resPath)
        elif (os.path.isfile(absPath) and absPath.find("main/index.js") == -1):
            dataStr = read_in_chunks(absPath)
            if dataStr != None:
                absPath = absPath.replace(resPath + '/', '')
                jsonObj[absPath] = dataStr

def getResMapScript(resPath):
    jsonObj = {}
    getResMap(jsonObj, resPath, resPath)
    jsonStr = simplejson.dumps(jsonObj)
    resStr = str("window.resMap = ") + jsonStr
    return resStr

# This issue is fixed in Cocos Creator 2.x
def fixEngineError(engineStr):
    newEngineStr = engineStr.replace("t.content instanceof Image", "t.content.tagName === \"IMG\"", 1)
    return newEngineStr

def addPlistSupport(mainStr):
    newMainStr = mainStr.replace("json: jsonBufferHandler,", "json: jsonBufferHandler, plist: jsonBufferHandler,", 1)
    return newMainStr

def integrate(projectRootPath, channel):
    if channel == 'facebook':
        htmlPath = projectRootPath + '/build/web-mobile/'+"index_facebook.html"
    elif channel == 'adwords':
        htmlPath = projectRootPath + '/build/web-mobile/'+"index_adwords.html"
    else:
        htmlPath = projectRootPath + '/build/web-mobile/index.html'
    save_root = './build/'+channel + '/'
    if not os.path.exists(save_root):
        os.makedirs(save_root)
    newHtmlPath = save_root + 'index.html'
    settingScrPath = projectRootPath + '/build/web-mobile/src/settings.js'
    mainScrPath = projectRootPath + '/build/web-mobile/main.js'
    engineScrPath = projectRootPath + '/build/web-mobile/cocos2d-js-min.js'
    projectScrPath = projectRootPath + '/build/web-mobile/assets/main/index.js'
    resPath = projectRootPath + '/build/web-mobile/assets'
    indexInternalScrPath = projectRootPath + '/build/web-mobile/assets/internal/index.js'
    jsContent = ""
    htmlStr = read_in_chunks(htmlPath)
    #cocosengine
    engineStr = read_in_chunks(engineScrPath)
    engineStr = fixEngineError(engineStr)
    if channel == 'adwords':
        jsContent = jsContent + engineStr + "\n"
    else:
        htmlStr = htmlStr.replace(engineMatchKey, engineStr, 1)
    #resources
    resStr = getResMapScript(resPath)
    if channel == 'common':
        htmlStr = htmlStr.replace(resMapMatchKey, resStr, 1)
    elif channel == 'adwords':
        jsContent = jsContent + resStr + "\n"
    else:
        save_js_path = save_root + "js/"
        if not os.path.exists(save_js_path):
            os.makedirs(save_js_path)
        writeToPath(save_js_path + 'res.js', resStr)
    #settings
    settingsStr = read_in_chunks(settingScrPath)
    if channel == 'adwords':
        jsContent = jsContent + settingsStr + "\n"
    else:
        htmlStr = htmlStr.replace(settingMatchKey, settingsStr, 1)
    #project
    projectStr = read_in_chunks(projectScrPath)
    if channel == 'adwords':
        jsContent = jsContent + projectStr + "\n"
    else:
        htmlStr = htmlStr.replace(projectMatchKey, projectStr, 1)
     #main
    mainStr = read_in_chunks(mainScrPath)
    mainStr = addPlistSupport(mainStr)
    if channel == 'adwords':
        jsContent = jsContent + mainStr + "\n"
    else:
        htmlStr = htmlStr.replace(mainMatchKey, mainStr, 1)

    if channel == 'adwords':
        writeToPath(save_root+"all.js", jsContent)

    writeToPath(newHtmlPath, htmlStr)

    targetFileSize = os.path.getsize(newHtmlPath)
    targetFileSizeInMegabyte = math.ceil(targetFileSize * 1000 / (1024 * 1024)) / 1000

    print("===================  All Done! =================== ")
    print("Target file = {}, with size {}M".format(newHtmlPath, targetFileSizeInMegabyte))

if __name__ == '__main__':
    workDir = os.getcwd() + "/.."
    integrate(workDir)