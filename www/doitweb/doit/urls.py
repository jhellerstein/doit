# Copyright (c) 2011 Massachusetts Institute of Technology
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to
# deal in the Software without restriction, including without limitation the
# rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
# sell copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

from django.conf.urls.defaults import *
from django.views.generic.simple import redirect_to

urlpatterns = patterns('doit.views',
    (r'^(?P<dbname>\w+)/$', 'source_index'),

    (r'^(?P<dbname>\w+)/lowscorers/$', 'lowscoremapper'),
    (r'^(?P<dbname>\w+)/(?P<sid>\d+)/$', 'mapper'),
    (r'^(?P<dbname>\w+)/(?P<sid>\d+)/save$', 'mapper_results'),

    (r'^(?P<dbname>\w+)/(?P<sid>\d+)/(?P<fid>[^/]+)/$', redirect_to, {'url': 'summary',}),
    (r'^(?P<dbname>\w+)/(?P<sid>\d+)/(?P<fid>[^/]+)/summary$', 'detail_summary'),
    (r'^(?P<dbname>\w+)/(?P<sid>\d+)/(?P<fid>[^/]+)/values/$', redirect_to, {'url': 'examples',}),
    (r'^(?P<dbname>\w+)/(?P<sid>\d+)/(?P<fid>[^/]+)/values/examples$', 'detail_examples'),
    (r'^(?P<dbname>\w+)/(?P<sid>\d+)/(?P<fid>[^/]+)/values/shared$', 'detail_shared'),
    (r'^(?P<dbname>\w+)/(?P<sid>\d+)/(?P<fid>[^/]+)/values/distro$', 'detail_distro'),
    (r'^(?P<dbname>\w+)/(?P<sid>\d+)/(?P<fid>[^/]+)/scores$', 'detail_scoring'),

    (r'^(?P<dbname>\w+)/process/(?P<sid>\d+)/(?P<method_index>[0-4])/', 'source_processor'),
)
