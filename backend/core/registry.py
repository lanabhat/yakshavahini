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
class TaxonomyField:
    """A field on the entry model that points at a shared lookup table
    (Author, Publisher, Category, Contributor, ...) instead of storing a
    plain scalar. `multi=False` is a single ForeignKey (settable pre-save via
    a `{name}_name` payload key); `multi=True` is a ManyToMany (settable only
    after the entry has a pk, via a `{name}_names` list payload key — see
    `apply_m2m_fields` in serializers.py)."""
    name: str
    label: str
    model_path: str  # 'pustakakosha.Author'
    multi: bool = False


@dataclass
class GroupableField:
    """A plain field usable for facet/grouping browse (like Pratisangraha's
    browse-by-Kavi/Publisher), without needing a separate taxonomy model —
    just DISTINCT-with-counts over a CharField/TextField on the entry itself.
    `multivalue=True` means the field stores several values delimited by
    `delimiter` (e.g. "ಮಧ್ಯಮಾವತಿ, ಕಲ್ಯಾಣಿ, ಹಂಸಳ"), so grouping splits on it
    first instead of treating the whole string as one group."""
    name: str
    label: str
    multivalue: bool = False
    delimiter: str = ','


@dataclass
class DisplayField:
    """An optional/secondary field a project can expose beyond its title —
    broader than the facet-only GroupableField/TaxonomyField lists, since not
    every displayable field needs to be filterable. Drives the admin's
    list-view display-field picker (ListDisplayConfigView) and mirrors the
    public frontend's own displayFields config field-for-field."""
    name: str
    label: str
    kind: str = 'text'  # 'text' | 'taxonomy-single' | 'taxonomy-multi'


@dataclass
class ProjectSchema:
    slug: str
    label: str
    model_path: str  # 'app_label.ModelName', resolved lazily to avoid import-order issues
    title_field: str  # the main searchable/display field
    taxonomy_fields: list = field(default_factory=list)  # list[TaxonomyField]
    link_fields: list = field(default_factory=list)  # list[LinkField]
    date_fields: list = field(default_factory=list)  # plain field names
    sortable_fields: dict = field(default_factory=dict)  # api sort key -> ORM field path
    filterable_fields: list = field(default_factory=list)  # plain field names, icontains filter
    groupable_fields: list = field(default_factory=list)  # list[GroupableField]
    display_fields: list = field(default_factory=list)  # list[DisplayField]
    # Label for the combined date_fields as a single selectable/orderable
    # "date" entry in the list-view display-field picker (see
    # ListDisplayConfigView) — empty means this project has no date to offer.
    date_display_label: str = ''

    def get_model(self):
        from django.apps import apps
        app_label, model_name = self.model_path.split('.')
        return apps.get_model(app_label, model_name)


PROJECT_REGISTRY = {
    'mattukosha': ProjectSchema(
        slug='mattukosha',
        label='Mattukosha',
        model_path='mattukosha.MattukoshaEntry',
        title_field='name',
        taxonomy_fields=[
            TaxonomyField(name='ragas', label='ಹೊಂದುವ ರಾಗಗಳು', model_path='mattukosha.Raga', multi=True),
            TaxonomyField(name='situations', label='ಸಂದರ್ಭ ಸೂಕ್ತತೆ', model_path='mattukosha.Situation', multi=True),
        ],
        link_fields=[
            LinkField(name='pdf_link', label='Document', render_as='pdf'),
            LinkField(name='youtube_video_links', label='YouTube Videos', render_as='youtube', is_array=True),
        ],
        date_fields=['date_kannada', 'date_english'],
        sortable_fields={
            'entry_id': 'entry_id',
            'title': 'name',
            'date': 'date_english',
        },
        filterable_fields=['name', 'type', 'unique_number'],
        groupable_fields=[
            GroupableField(name='type', label='ಛಂದಸ್ಸಿನ ವಿಧ'),
        ],
        display_fields=[
            DisplayField(name='unique_number', label='ಅನನ್ಯ ಸಂಖ್ಯೆ'),
            DisplayField(name='type', label='ಛಂದಸ್ಸಿನ ವಿಧ'),
            DisplayField(name='ragas', label='ಹೊಂದುವ ರಾಗಗಳು', kind='taxonomy-multi'),
            DisplayField(name='situations', label='ಸಂದರ್ಭ ಸೂಕ್ತತೆ', kind='taxonomy-multi'),
        ],
        date_display_label='ದಸ್ತಾವೇಜನ್ನು ಸೇರಿಸಿದ ದಿನಾಂಕ',
    ),
    'pustakakosha': ProjectSchema(
        slug='pustakakosha',
        label='Pustaka Kosha',
        model_path='pustakakosha.PustakaKoshaEntry',
        title_field='book_name',
        taxonomy_fields=[
            TaxonomyField(name='authors', label='ಲೇಖಕ/ಸಂಪಾದಕ', model_path='pustakakosha.Author', multi=True),
            TaxonomyField(name='category', label='ಪುಸ್ತಕದ ವಿಭಾಗ', model_path='pustakakosha.Category'),
            TaxonomyField(name='publisher', label='ಪ್ರಕಾಶಕ', model_path='pustakakosha.Publisher'),
            TaxonomyField(name='contributors', label='ಕೋಶಕ್ಕೆ ಸೇರಿಸಲು ಸಹಕರಿದವರು', model_path='pustakakosha.Contributor', multi=True),
        ],
        link_fields=[
            LinkField(name='pdf_link', label='ಪುಸ್ತಕದ ಕೊಂಡಿ', render_as='pdf'),
            LinkField(name='thumbnail', label='ಮುಖಚಿತ್ರ (Thumbnail)', render_as='image'),
        ],
        date_fields=['date_added', 'date_added_english'],
        sortable_fields={
            'entry_id': 'entry_id',
            'title': 'book_name',
            'date': 'date_added_english',
            'year': 'year',
        },
        filterable_fields=['book_name', 'details', 'version', 'year', 'isbn', 'summary', 'more_details'],
        groupable_fields=[
            GroupableField(name='year', label='ಪ್ರಕಾಶನ ಕಾಲ'),
        ],
        display_fields=[
            DisplayField(name='details', label='ವಿವರಗಳು'),
            DisplayField(name='authors', label='ಲೇಖಕ/ಸಂಪಾದಕ', kind='taxonomy-multi'),
            DisplayField(name='category', label='ಪುಸ್ತಕದ ವಿಭಾಗ', kind='taxonomy-single'),
            DisplayField(name='publisher', label='ಪ್ರಕಾಶಕ', kind='taxonomy-single'),
            DisplayField(name='version', label='ಆವೃತ್ತಿ'),
            DisplayField(name='year', label='ಪ್ರಕಾಶನ ಕಾಲ'),
            DisplayField(name='isbn', label='ಪುಸ್ತಕದ ಐ.ಎಸ್.ಬಿ.ಎನ್'),
            DisplayField(name='contributors', label='ಕೋಶಕ್ಕೆ ಸೇರಿಸಲು ಸಹಕರಿದವರು', kind='taxonomy-multi'),
            DisplayField(name='summary', label='ಸಾರಾಂಶ'),
            DisplayField(name='more_details', label='ಹೆಚ್ಚಿನ ವಿವರ'),
        ],
        date_display_label='ಕೋಶಕ್ಕೆ ಸೇರಿಸಲ್ಪಟ್ಟ ದಿನಾಂಕ',
    ),
    'sanghatanakosha': ProjectSchema(
        slug='sanghatanakosha',
        label='Sanghatana Kosha',
        model_path='sanghatanakosha.SanghatanaKoshaEntry',
        title_field='name_of_the_org',
        taxonomy_fields=[],
        link_fields=[
            LinkField(name='details_pdf', label='ಯಕ್ಷ ಸಂಘಟನೆಯ ವಿವರಗಳಿಗಾಗಿ ಕೊಂಡಿ', render_as='pdf'),
        ],
        date_fields=[],
        sortable_fields={
            'entry_id': 'entry_id',
            'title': 'name_of_the_org',
        },
        filterable_fields=[
            'name_of_the_org', 'details', 'type_of_org', 'yakshagana_category',
            'yakshagana_sub_category', 'estabishment_date', 'state_of_the_est', 'head_quarter',
        ],
        groupable_fields=[
            GroupableField(name='type_of_org', label='ಸಂಘಟನೆಯ ವಿಧ'),
            GroupableField(name='yakshagana_category', label='ಯಕ್ಷಗಾನ ಪ್ರಬೇಧ'),
            GroupableField(name='yakshagana_sub_category', label='ಯಕ್ಷಗಾನ ಉಪ ಪ್ರಬೇಧ'),
        ],
        display_fields=[
            DisplayField(name='type_of_org', label='ಸಂಘಟನೆಯ ವಿಧ'),
            DisplayField(name='yakshagana_category', label='ಯಕ್ಷಗಾನ ಪ್ರಬೇಧ'),
            DisplayField(name='yakshagana_sub_category', label='ಯಕ್ಷಗಾನ ಉಪ ಪ್ರಬೇಧ'),
            DisplayField(name='estabishment_date', label='ಸ್ಥಾಪನೆ ವರ್ಷ'),
            DisplayField(name='state_of_the_est', label='ಚೌಕಟ್ಟು / ಅಸ್ತಿತ್ವ'),
            DisplayField(name='head_quarter', label='ಪ್ರಧಾನ ಕಛೇರಿಯ ಸ್ಥಳ'),
        ],
    ),
    'drishyashravyakosha': ProjectSchema(
        slug='drishyashravyakosha',
        label='Drishya-Shravya Kosha',
        model_path='drishyashravyakosha.DrishyaShravyaKoshaEntry',
        title_field='subject',
        taxonomy_fields=[
            TaxonomyField(name='presenters', label='ಉಪನ್ಯಾಸಕರು', model_path='drishyashravyakosha.Presenter', multi=True),
        ],
        link_fields=[
            LinkField(name='video_link', label='YouTube/Facebook Link', render_as='youtube'),
        ],
        date_fields=['date_kannada', 'date_english'],
        sortable_fields={
            'entry_id': 'entry_id',
            'title': 'subject',
            'date': 'date_english',
        },
        filterable_fields=['subject', 'event_type', 'details'],
        groupable_fields=[
            GroupableField(name='event_type', label='ಕಾರ್ಯಕ್ರಮ'),
        ],
        display_fields=[
            DisplayField(name='event_type', label='ಕಾರ್ಯಕ್ರಮ'),
            DisplayField(name='details', label='ವಿವರಗಳು'),
            DisplayField(name='presenters', label='ಉಪನ್ಯಾಸಕರು', kind='taxonomy-multi'),
        ],
        date_display_label='ಪ್ರಸಾರದ ದಿನಾಂಕ',
    ),
}


def get_project(slug):
    try:
        return PROJECT_REGISTRY[slug]
    except KeyError:
        raise ValueError(f'Unknown project "{slug}" — must be one of {list(PROJECT_REGISTRY)}')
