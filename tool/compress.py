#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
from slimit import minify
import re
import shutil


TARGET = "../js"
DEST = os.path.join(TARGET, "min")
PATTERN = re.compile(os.path.join(TARGET, "(.*)".format(TARGET)))

EXCLUDES = [
    "htmlparser.js",
    ]


def check_dir(dir):
    if os.path.exists(dir):
        if not os.path.isdir(dir):
            raise OSError("File is already exists.")
    else:
        os.mkdir(dir)


if __name__ == "__main__":
    shutil.rmtree(DEST, ignore_errors=True)

    for path, dir, file_list in os.walk(TARGET):
        if "min" in path:
            continue

        for filename in file_list:
            if filename in EXCLUDES or not filename.endswith(".js"):
                continue

            r = PATTERN.match(path)
            if r:
                dest = os.path.join(DEST, r.groups()[0])
            else:
                dest = DEST
            check_dir(dest)
            src = os.path.join(path, filename)
            minjs = os.path.join(dest, filename[:-3] + ".min.js")
            f = open(minjs, "w")
            f.write(minify(open(src).read(), mangle=True))
            f.close()
            print('"{filename}" is generated.'.format(filename=minjs))
