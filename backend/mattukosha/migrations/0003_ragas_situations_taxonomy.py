import re

from django.db import migrations, models


def _split_names(raw):
    """Comma-separated free text -> a de-duplicated list of clean names.
    Strips whitespace and a trailing '.' (several source rows end entries
    with a stray period, e.g. "ಮೋಹನ." vs "ಮೋಹನ" elsewhere — without this
    they'd become two different taxonomy entries for the same raga)."""
    if not raw:
        return []
    seen = []
    for part in raw.split(','):
        name = re.sub(r'\.+$', '', part.strip()).strip()
        if name and name not in seen:
            seen.append(name)
    return seen


def migrate_taxonomy_data(apps, schema_editor):
    MattukoshaEntry = apps.get_model('mattukosha', 'MattukoshaEntry')
    Situation = apps.get_model('mattukosha', 'Situation')
    Raga = apps.get_model('mattukosha', 'Raga')

    situation_cache = {}
    raga_cache = {}

    for entry in MattukoshaEntry.objects.all():
        for name in _split_names(entry.situations_text):
            if name not in situation_cache:
                situation_cache[name], _ = Situation.objects.get_or_create(name=name)
            entry.situations.add(situation_cache[name])

        for name in _split_names(entry.ragas_text):
            if name not in raga_cache:
                raga_cache[name], _ = Raga.objects.get_or_create(name=name)
            entry.ragas.add(raga_cache[name])


def reverse_noop(apps, schema_editor):
    # Data loss on the way in (free text -> normalized rows) isn't cleanly
    # reversible; reversing this migration just drops the taxonomy links,
    # same as it would if this were a fresh AddField with no data migration.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('mattukosha', '0002_rename_name_of_the_mattu_mattukoshaentry_name_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Situation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, unique=True)),
            ],
            options={'ordering': ['name'], 'abstract': False},
        ),
        migrations.CreateModel(
            name='Raga',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, unique=True)),
            ],
            options={'ordering': ['name'], 'abstract': False},
        ),
        migrations.RenameField(
            model_name='mattukoshaentry', old_name='situations', new_name='situations_text',
        ),
        migrations.RenameField(
            model_name='mattukoshaentry', old_name='ragas', new_name='ragas_text',
        ),
        migrations.AddField(
            model_name='mattukoshaentry', name='situations',
            field=models.ManyToManyField(blank=True, related_name='entries', to='mattukosha.situation'),
        ),
        migrations.AddField(
            model_name='mattukoshaentry', name='ragas',
            field=models.ManyToManyField(blank=True, related_name='entries', to='mattukosha.raga'),
        ),
        migrations.RunPython(migrate_taxonomy_data, reverse_noop),
        migrations.RemoveField(model_name='mattukoshaentry', name='situations_text'),
        migrations.RemoveField(model_name='mattukoshaentry', name='ragas_text'),
    ]
