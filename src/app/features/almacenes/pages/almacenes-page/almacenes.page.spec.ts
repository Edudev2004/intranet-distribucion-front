import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { AlmacenesPageComponent } from './almacenes.page';
import { environment } from '../../../../../environments/environment';
import { Almacen } from '../../almacen.model';

describe('AlmacenesPageComponent', () => {
  let component: AlmacenesPageComponent;
  let fixture: ComponentFixture<AlmacenesPageComponent>;
  let httpMock: HttpTestingController;

  const mockSedes = [
    { idSede: 1, nombre: 'Sede Central Callao' },
  ];

  const mockTipos = [
    { idTipoAlmacen: 1, nombre: 'Almacén Central / General' },
  ];

  const mockAlmacenes: Almacen[] = [
    {
      idAlmacen: 1,
      idSede: 1,
      sede: 'Sede Central Callao',
      nombre: 'Almacén Principal',
      idTipoAlmacen: 1,
      tipoAlmacen: 'Almacén Central',
      capacidadMaxima: 60000,
      ubicacion: 'Nave A',
      activo: true,
    },
    {
      idAlmacen: 2,
      idSede: 1,
      sede: 'Sede Central Callao',
      nombre: 'Almacén Frío',
      idTipoAlmacen: 1,
      tipoAlmacen: 'Almacén Central',
      capacidadMaxima: 10000,
      ubicacion: 'Nave B',
      activo: true,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlmacenesPageComponent],
      providers: [
        provideRouter([{ path: '**', component: class {} }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AlmacenesPageComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    fixture.detectChanges();

    // Responder llamadas de inicialización
    httpMock.expectOne(`${environment.apiUrl}/sedes`).flush(mockSedes);
    httpMock.expectOne(`${environment.apiUrl}/almacenes/tipos`).flush(mockTipos);
    httpMock.expectOne(`${environment.apiUrl}/almacenes`).flush(mockAlmacenes);

    // Responder llamadas de productos para stock ocupado
    httpMock.expectOne(`${environment.apiUrl}/almacenes/1/productos`).flush([
      { idProducto: 1, codigo: 'P01', producto: 'Prod 1', categoria: 'Cat', stockActual: 15000 },
    ]);
    httpMock.expectOne(`${environment.apiUrl}/almacenes/2/productos`).flush([
      { idProducto: 2, codigo: 'P02', producto: 'Prod 2', categoria: 'Cat', stockActual: 8000 },
    ]);

    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe crearse correctamente y listar almacenes', () => {
    expect(component).toBeTruthy();
    expect(component.almacenes().length).toBe(2);
  });

  it('debe calcular el stock ocupado y porcentaje por almacen', () => {
    const a1 = component.almacenes()[0];
    const a2 = component.almacenes()[1];

    expect(component.getStockOcupado(a1.idAlmacen)).toBe(15000);
    expect(component.getPorcentajeOcupacion(a1)).toBe(25); // 15000 / 60000 = 25%
    expect(component.getOcupacionClase(a1)).toBe('optimo');
    expect(component.getOcupacionEtiqueta(a1)).toBe('Disponible');

    expect(component.getStockOcupado(a2.idAlmacen)).toBe(8000);
    expect(component.getPorcentajeOcupacion(a2)).toBe(80); // 8000 / 10000 = 80%
    expect(component.getOcupacionClase(a2)).toBe('moderado');
    expect(component.getOcupacionEtiqueta(a2)).toBe('Alto');
  });

  it('debe clasificar como critico cuando la ocupacion supera el 90%', () => {
    const almacenLleno: Almacen = {
      idAlmacen: 99,
      idSede: 1,
      sede: 'Sede Test',
      nombre: 'Almacén Lleno',
      idTipoAlmacen: 1,
      tipoAlmacen: 'Tipo',
      capacidadMaxima: 1000,
      ubicacion: null,
      activo: true,
    };

    component.stockPorAlmacen.set({ 99: 950 });
    expect(component.getPorcentajeOcupacion(almacenLleno)).toBe(95);
    expect(component.getOcupacionClase(almacenLleno)).toBe('critico');
    expect(component.getOcupacionEtiqueta(almacenLleno)).toBe('Saturado');
  });

  it('debe renderizar la columna de capacidad con formato y unidad pallets', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const tableText = compiled.querySelector('.data-table')?.textContent ?? '';

    expect(tableText).toContain('Capacidad & Ocupación');
    expect(tableText).toContain('60,000');
    expect(tableText).toContain('pallets');
    expect(tableText).toContain('25%');
  });

  it('debe mostrar el selector de unidades con pallets por defecto y proximamente en las demas', () => {
    component.nuevo();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const options = compiled.querySelectorAll('select[title*="próximamente"] option');
    expect(options.length).toBe(4);
    expect(options[0].textContent).toContain('Pallets (pallets) [Por defecto]');
    expect(options[1].textContent).toContain('Unidades (und.) (Próximamente)');
    expect(options[2].textContent).toContain('Kilogramos (kg) (Próximamente)');
    expect(options[3].textContent).toContain('Metros cúbicos (m³) (Próximamente)');
  });
});
