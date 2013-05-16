#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
http://www.javascriptlint.com/

jslを使用して構文チェックを行います。
"""
import sys
import os
from commands import getoutput


JSL_PATH = "./jsl"
TARGET = "../sample"
EXCLUDES = [
    ]

if __name__ == "__main__":
    error = False
    for path, dir, file_list in os.walk(TARGET):
        if "min" in path:
            continue

        for filename in file_list:
            if filename.endswith(".js") and filename not in EXCLUDES:
                cmd = "{} -process {} -nologo".format(JSL_PATH, os.path.join(path, filename))
                r = getoutput(cmd)
                line = r.split("\n")[-1]
                result = line.split(" ")
                if result[0] != "0" or result[2] != "0":
                    print("[{}] {}".format(filename, r))
                    error = True
                else:
                    print("[{}] {}".format(filename, line))

    if error:
        print("JavaScript Lint NG")
        sys.exit(1)
    else:
        print("JavaScript Lint OK")
