#!/bin/bash

echo New article
git checkout master
read -p 'slug: ' slug
git checkout -b p/$slug
hugo new posts/$slug/index.md
open content/posts/$slug/index.md
echo New article template created
