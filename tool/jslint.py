#!/usr/bin/env python
# -*- coding: utf-8 -*-
import urllib
import sys
import os
from HTMLParser import HTMLParser

URL = "http://www.javascriptlint.com/online_lint.php"
DIR = "../js"
TARGETS = [
    "zz.js",
    "plugin/zz.adv.js",
    "plugin/ezslide.zz.js",
    "plugin/loadingBar.zz.js",
    "plugin/util.zz.js",
    ]


def request(jsfile):
    params = {
        "script": open(os.path.join(DIR, jsfile)).read(),
        }
    response = urllib.urlopen(URL, urllib.urlencode(params))
    return response.read()


class JSLintParser(HTMLParser):
    def __init__(self):
        HTMLParser.__init__(self)
        self.script = []
        self.inner = False
        self.nest = 0
        self.count = 0

    def handle_starttag(self, tag, attribute):
        attr = dict(attribute)
        size = self.nest
        funcs = [
            lambda tag, attr: tag == "div" and "id" in attr and attr["id"] == "code",
            lambda tag, attr: tag == "div",
            lambda tag, attr: tag == "span",
            ]
        try:
            if funcs[size](tag, attr):
                self.nest += 1
            if self.nest == 3:
                self.count += 1
        except IndexError:
            pass

    def handle_endtag(self, tag):
        key = [
            None,
            "div",
            "div",
            "span"
            ]
        if self.nest:
            if tag == key[self.nest]:
                self.nest -= 1
                if self.nest < 0:
                    raise RuntimeError


if __name__ == "__main__":
    for jsfile in TARGETS:
        html = request(jsfile)
        parser = JSLintParser()
        parser.feed(html)
        parser.close()

        print("[{filename}] erros: {count}".format(filename=jsfile, count=parser.count))

        if parser.count:
            sys.exit(1)
