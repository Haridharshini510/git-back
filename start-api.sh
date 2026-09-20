#!/bin/bash
export GITBACK_AWS_REGION=us-west-2
export GITBACK_TABLE=claude-code-gitback
export AWS_REGION=us-west-2
node packages/api/dist/index.js
