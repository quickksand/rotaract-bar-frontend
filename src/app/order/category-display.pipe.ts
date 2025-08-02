import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'categoryDisplay',
  standalone: true,
  pure: true
})
export class CategoryDisplayPipe implements PipeTransform {

  private readonly mappings: Record<string, string> = {
    'DRINKS': '🍹 LONGDRINKS',
    'BEER_WINE_NONALC': '🍺 BIER & NON-ALK',
    'SHOTS': '🥃 SHOTS'
  };

  transform(category: string): string {
    return this.mappings[category] || category;
  }
}
