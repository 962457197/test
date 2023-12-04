#!/usr/bin/python3

import integrate_res_in_html
import tinify_png
import os
import argparse

workdir = os.getcwd()
projectRootPath = workdir + "/.."
resPath = projectRootPath + '/build/web-mobile/assets'

def generate_html(channel, need2TinifyPic):
    if need2TinifyPic:
        print("=================== Start to Compress All Pictures ====================")
        tinify_png.tinifyPic(resPath)

    print("=================== Start to Integrate Res into Html ====================")
    integrate_res_in_html.integrate(projectRootPath, channel)

if __name__ == '__main__':
    need2TinifyPic = False
    channel = "common"
    # 创建解析器对象
    parser = argparse.ArgumentParser()
    # 添加命令行参数
    parser.add_argument("--channel", help="渠道")
    parser.add_argument("--tinify", help="是否压缩PNG", action='store_true')
    # 解析命令行参数
    args = parser.parse_args()
    # 打印命令行参数
    if args.channel != None:
        channel = args.channel
        print("channel:", args.channel)
    if args.tinify != None:
        need2TinifyPic = args.tinify
        print("tinify:", args.tinify)
    generate_html(channel, need2TinifyPic)



