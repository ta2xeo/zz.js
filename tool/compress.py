#!/usr/bin/env python
# -*- coding: utf-8 -*-
import urllib
import os
from HTMLParser import HTMLParser

URL = "http://jscompress.com/"
SRC = "../js"
DEST = "../js/min"
TARGETS = [
    "zz.js",
    "module/zz.adv.js",
    "module/zz.suspend.js",

    "module/ezslide.zz.js",
    "module/loadingBar.zz.js",
    "module/util.zz.js",
    ]


def request(jsfile):
    params = {
        "js_in": open(os.path.join(SRC, jsfile)).read()
        }
    response = urllib.urlopen(URL, urllib.urlencode(params))
    return response.read()


class CompressionParser(HTMLParser):
    def __init__(self):
        HTMLParser.__init__(self)
        self.script = []
        self.inner = False

    def handle_starttag(self, tag, attrs):
        if tag == "textarea":
            attr = dict(attrs)
            if attr["name"] == "js_out":
                self.inner = True

    def handle_endtag(self, tag):
        if tag == "textarea":
            self.inner = False

    def handle_data(self, data):
        if self.inner is True:
            self.script.append(data)

    def handle_entityref(self, name):
        if self.inner is True:
            self.script.append({
                "quot": '"',
                "lt": "<",
                "amp": "&",
                "gt": ">",
                }[name])


def check_dir(dir):
    if os.path.exists(dir):
        if not os.path.isdir(dir):
            raise OSError("File is already exists.")
    else:
        os.mkdir(dir)


if __name__ == "__main__":
    for jsfile in TARGETS:
        minjs = jsfile[:-3] + ".min.js"
        check_dir(os.path.dirname(os.path.join(DEST, minjs)))
        html = request(jsfile)
        parser = CompressionParser()
        parser.feed(html)
        parser.close()

        minjs = jsfile[:-3] + ".min.js"
        f = open(os.path.join(DEST, minjs), "w")
        f.write("".join(parser.script))
        f.close()
        print('"{filename}" is generated.'.format(filename=minjs))
