import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, beforeEach, it, expect } from 'vitest';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([{ path: '**', component: class {} }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe mostrar el logo completo enruta.webp cuando la barra no esta colapsada', () => {
    component.collapsed = false;
    fixture.detectChanges();

    const fullLogo = fixture.nativeElement.querySelector('.sidebar-logo-img') as HTMLImageElement;
    expect(fullLogo).toBeTruthy();
    expect(fullLogo.getAttribute('src')).toBe('enruta.webp');

    const collapsedLogo = fixture.nativeElement.querySelector('.sidebar-logo-collapsed');
    expect(collapsedLogo).toBeNull();
  });

  it('debe mostrar el logotipo simplificado EnRuta-Logotipo.webp cuando la barra esta colapsada', () => {
    component.collapsed = true;
    fixture.detectChanges();

    const collapsedLogo = fixture.nativeElement.querySelector('.sidebar-logo-collapsed') as HTMLImageElement;
    expect(collapsedLogo).toBeTruthy();
    expect(collapsedLogo.getAttribute('src')).toBe('EnRuta-Logotipo.webp');

    const fullLogo = fixture.nativeElement.querySelector('.sidebar-logo-img');
    expect(fullLogo).toBeNull();
  });

  it('debe alternar el estado de colapso y emitir collapsedChange', () => {
    let emittedValue: boolean | undefined;
    component.collapsedChange.subscribe((val: boolean) => {
      emittedValue = val;
    });

    component.collapsed = false;
    component.toggleCollapse();

    expect(component.collapsed).toBe(true);
    expect(emittedValue).toBe(true);
  });

  it('debe alternar el estado de colapso de una seccion de navegacion', () => {
    const section = component.sections[0];
    const initialCollapsed = !!section.collapsed;

    component.toggleSection(section);
    expect(section.collapsed).toBe(!initialCollapsed);
  });
});
