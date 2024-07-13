#!/bin/bash
apt-cache search . | awk '{print $1}' > ./package_list.txt
