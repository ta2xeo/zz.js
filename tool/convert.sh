#!/bin/sh
# -*- coding: utf-8 -*-
python jslint.py
if [ $? != 0 ]; then
    exit 1
fi

python compress.py
