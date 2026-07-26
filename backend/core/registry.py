"""
Central registry describing each project's schema, so the generic views in
`core/generic_views.py` can operate on any project's entry model without
hardcoding field names. Adding a new project (Pustaka Sangraha, Sanghatana
Kosha, ...) means adding one entry here plus a small app with its own
concrete model — no changes to the generic view/serializer layer.
"""

from dataclasses import dataclass, field


@dataclass
class LinkField:
    name: str
    label: str
    render_as: str = 'link'  # 'pdf' | 'youtube' | 'link'
    is_array: bool = False


@dataclass
class ProjectSchema:
    slug: str
    label: str
    model_path: str  # 'app_label.ModelName', resolved lazily to avoid import-order issues
    title_field: str  # the main searchable/display field
    taxonomy_models: list = field(default_factory=list)  # [(field_name, 'app_label.ModelName'), ...]
    link_fields: list = field(default_factory=list)  # list[LinkField]
    date_fields: list = field(default_factory=list)  # plain field names
    sortable_fields: dict = field(default_factory=dict)  # api sort key -> ORM field path
    filterable_fields: list = field(default_factory=list)  # plain field names, icontains filter

    def get_model(self):
        from django.apps import apps
        app_label, model_name = self.model_path.split('.')
        return apps.get_model(app_label, model_name)


PROJECT_REGISTRY = {
    'mattukosha': ProjectSchema(
        slug='mattukosha',
        label='Mattukosha',
        model_path='mattukosha.MattukoshaEntry',
        title_field='name_of_the_mattu',
        taxonomy_models=[],
        link_fields=[
            LinkField(name='link_to_pdf_document', label='PDF Document', render_as='pdf'),
            LinkField(name='youtube_video_links', label='YouTube Videos', render_as='youtube', is_array=True),
        ],
        date_fields=['date_kannada', 'date_english'],
        sortable_fields={
            'entry_id': 'entry_id',
            'title': 'name_of_the_mattu',
            'date': 'date_english',
        },
        filterable_fields=['name_of_the_mattu'],
    ),
}


def get_project(slug):
    try:
        return PROJECT_REGISTRY[slug]
    except KeyError:
        raise ValueError(f'Unknown project "{slug}" — must be one of {list(PROJECT_REGISTRY)}')
